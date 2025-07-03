require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("./src/db");
const upload = require("./src/uploadConfig");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API TCC está ativa!");
});

// CREATE – Cadastro de usuário
app.post("/users", async (req, res) => {
  const { nome, sobrenome, dataNascimento, genero, email, senha } = req.body;
  if (!nome || !sobrenome || !dataNascimento || !genero || !email || !senha) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }
  if (!["M", "F"].includes(genero)) {
    return res.status(400).json({ message: 'Gênero deve ser "M" ou "F"' });
  }
  try {
    const pool = await poolPromise;
    const senhaHash = await bcrypt.hash(senha, 10);
    await pool
      .request()
      .input("nome", sql.NVarChar, nome)
      .input("sobrenome", sql.NVarChar, sobrenome)
      .input("dataNascimento", sql.Date, dataNascimento)
      .input("genero", sql.Char(1), genero)
      .input("email", sql.NVarChar, email)
      .input("senhaHash", sql.NVarChar, senhaHash).query(`
        INSERT INTO Usuarios
          (nome, sobrenome, dataNascimento, genero, email, senhaHash)
        VALUES
          (@nome, @sobrenome, @dataNascimento, @genero, @email, @senhaHash);
      `);
    res.status(201).json({ message: "Usuário criado com sucesso" });
  } catch (err) {
    console.error("Erro no cadastro:", err);
    if (err.number === 2627)
      return res.status(409).json({ message: "E-mail já cadastrado" });
    res.status(500).json({ message: "Erro interno" });
  }
});

// READ – Listar todos os usuários
app.get("/users", async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT id, nome, sobrenome, dataNascimento, genero,
           email, fotoPerfil, tipo
    FROM Usuarios
  `);
  res.json(result.recordset);
});

// READ – Obter um usuário pelo ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const result = await pool.request().input("id", sql.UniqueIdentifier, id)
    .query(`
      SELECT id, nome, sobrenome, dataNascimento, genero,
             email, fotoPerfil, tipo
      FROM Usuarios
      WHERE id = @id
    `);
  if (result.recordset.length === 0)
    return res.status(404).json({ message: "Usuário não encontrado" });
  res.json(result.recordset[0]);
});

// SEARCH – Buscar usuário(s) por nome
app.get("/users/nome/:nome", async (req, res) => {
  const nome = req.params.nome;
  if (!nome) {
    return res.status(400).json({ message: 'Parâmetro "nome" é obrigatório' });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("nome", sql.NVarChar, `%${nome}%`)
      .query(`
        SELECT id, nome, email, fotoPerfil, tipo
        FROM Usuarios
        WHERE nome LIKE @nome
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao buscar por nome:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// UPDATE – Atualizar nome, fotoPerfil e tipo
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, sobrenome, dataNascimento, genero, fotoPerfil, tipo } =
    req.body;
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("nome", sql.NVarChar, nome)
    .input("sobrenome", sql.NVarChar, sobrenome)
    .input("dataNascimento", sql.Date, dataNascimento)
    .input("genero", sql.Char(1), genero)
    .input("fotoPerfil", sql.NVarChar, fotoPerfil)
    .input("tipo", sql.Int, tipo).query(`
      UPDATE Usuarios
      SET nome          = @nome,
          sobrenome     = @sobrenome,
          dataNascimento= @dataNascimento,
          genero        = @genero,
          fotoPerfil    = @fotoPerfil,
          tipo          = @tipo
      WHERE id = @id
    `);
  res.json({ message: "Usuário atualizado com sucesso" });
});

// DELETE – Remover usuário
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .query("DELETE FROM Usuarios WHERE id = @id");
    console.log("Usuário removido:", id);
    res.json({ message: "Usuário removido com sucesso" });
  } catch (err) {
    console.error("Erro ao remover usuário:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// LOGIN – Autenticar usuário por email e senha
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("email", sql.NVarChar, email)
      .query(`
        SELECT id, nome, sobrenome, senhaHash
        FROM dbo.Usuarios
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const user = result.recordset[0];
    const match = await bcrypt.compare(senha, user.senhaHash);
    if (!match) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    console.log(`Usuário autenticado: ${email}`);
    res.json({
      message: "Login bem-sucedido",
      user: { id: user.id, nome: user.nome, sobrenome: user.sobrenome },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

//Foto Perfil

app.put("/users/:id/avatar", upload.single("avatar"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: "Foto obrigatória" });

  const fotoUrl = `http://10.0.2.2:3000/uploads/${req.file.filename}`;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("fotoPerfil", sql.NVarChar, fotoUrl).query(`
        UPDATE dbo.Usuarios
        SET fotoPerfil = @fotoPerfil
        WHERE id = @id
      `);

    res.json({ message: "Foto atualizada", fotoPerfil: fotoUrl });
  } catch (err) {
    console.error("Erro ao salvar foto:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

/* FEED DE POSTES */
// POST /posts  (criar)
app.post("/posts", upload.single("foto"), async (req, res) => {
  const { usuarioId, legenda } = req.body;
  if (!req.file) return res.status(400).json({ message: "Foto obrigatória" });

  const imagemUrl = `http://10.0.2.2:3000/uploads/${req.file.filename}`;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, usuarioId)
      .query("SELECT 1 FROM dbo.Usuarios WHERE id = @id"); // checa usuário

    await pool
      .request()
      .input("usuarioId", sql.UniqueIdentifier, usuarioId)
      .input("imagemUrl", sql.NVarChar, imagemUrl)
      .input("legenda", sql.NVarChar, legenda).query(`
        INSERT INTO dbo.Posts (usuarioId, imagemUrl, legenda)
        VALUES (@usuarioId, @imagemUrl, @legenda);
      `);

    // incrementa contador (opcional)
    await pool.request().input("usuarioId", sql.UniqueIdentifier, usuarioId)
      .query(`
        UPDATE dbo.Usuarios
        SET totalPosts = totalPosts + 1
        WHERE id = @usuarioId;
      `);

    res.status(201).json({ message: "Post criado", imagemUrl });
  } catch (err) {
    console.error("Erro no upload:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /posts  (feed público – últimos primeiro)
app.get("/posts", async (req, res) => {
  const uid = req.query.uid || "00000000-0000-0000-0000-000000000000"; // caso não mande uid
  try {
    const pool = await poolPromise;
    const posts = await pool.request().input("uid", sql.UniqueIdentifier, uid)
      .query(`
        SELECT  p.id, p.imagemUrl, p.legenda, p.createdAt,
                (SELECT COUNT(*) FROM dbo.PostLikes pl WHERE pl.postId = p.id) AS likes,
                (SELECT COUNT(*) FROM dbo.Comentarios c  WHERE c.postId  = p.id) AS comments,
                CASE WHEN EXISTS (SELECT 1 FROM dbo.PostLikes pl
                                  WHERE pl.postId = p.id AND pl.usuarioId = @uid)
                     THEN 1 ELSE 0 END AS curtiu,
                u.id   AS autorId, u.nome, u.sobrenome, u.fotoPerfil
        FROM dbo.Posts p
        JOIN dbo.Usuarios u ON u.id = p.usuarioId
        ORDER BY p.createdAt DESC;
      `);
    res.json(posts.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

//GET Posts por usuário
app.get("/users/:id/posts", async (req, res) => {
  const { id } = req.params; // usuário que estou vendo
  const uid = req.query.uid || id; // quem está logado (p/ marcar curtiu)
  try {
    const pool = await poolPromise;
    const posts = await pool
      .request()
      .input("uid", sql.UniqueIdentifier, uid)
      .input("id", sql.UniqueIdentifier, id).query(`
        SELECT  p.id, p.imagemUrl, p.legenda, p.createdAt,
                (SELECT COUNT(*) FROM dbo.PostLikes pl WHERE pl.postId = p.id) AS likes,
                (SELECT COUNT(*) FROM dbo.Comentarios c  WHERE c.postId  = p.id) AS comments,
                CASE WHEN EXISTS (SELECT 1 FROM dbo.PostLikes pl
                                  WHERE pl.postId = p.id AND pl.usuarioId = @uid)
                     THEN 1 ELSE 0 END AS curtiu,
                u.id AS autorId, u.nome, u.sobrenome, u.fotoPerfil
        FROM dbo.Posts p
        JOIN dbo.Usuarios u ON u.id = p.usuarioId
        WHERE p.usuarioId = @id
        ORDER BY p.createdAt DESC;
      `);
    res.json(posts.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

/*SEGUIDORES*/

// Seguir
app.post("/follow", async (req, res) => {
  const { seguidorId, seguidoId } = req.body;
  if (!seguidorId || !seguidoId)
    return res.status(400).json({ message: "Ids obrigatórios" });

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("seguidorId", sql.UniqueIdentifier, seguidorId)
      .input("seguidoId", sql.UniqueIdentifier, seguidoId)
      .query(
        `INSERT INTO dbo.Seguidores(seguidorId, seguidoId) VALUES (@seguidorId,@seguidoId)`
      );

    res.json({ message: "Agora você segue este usuário" });
  } catch (err) {
    if (err.number === 2627) {
      return res.status(409).json({ message: "Você já segue esse usuário" });
    }
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// Deixar de seguir
app.delete("/follow", async (req, res) => {
  const { seguidorId, seguidoId } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("seguidorId", sql.UniqueIdentifier, seguidorId)
      .input("seguidoId", sql.UniqueIdentifier, seguidoId)
      .query(
        `DELETE FROM dbo.Seguidores WHERE seguidorId=@seguidorId AND seguidoId=@seguidoId`
      );
    res.json({ message: "Deixou de seguir" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// Contagem de seguidores
app.get("/users/:id/followers/count", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const r = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query(`SELECT COUNT(*) AS total FROM dbo.Seguidores WHERE seguidoId=@id`);
  res.json({ total: r.recordset[0].total });
});

// Contagem de seguidos
app.get("/users/:id/following/count", async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const r = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query(`SELECT COUNT(*) AS total FROM dbo.Seguidores WHERE seguidorId=@id`);
  res.json({ total: r.recordset[0].total });
});

// Verificar se ja segue
app.get("/follow/status", async (req, res) => {
  const { seguidorId, seguidoId } = req.query;
  const pool = await poolPromise;
  const r = await pool
    .request()
    .input("seguidorId", sql.UniqueIdentifier, seguidorId)
    .input("seguidoId", sql.UniqueIdentifier, seguidoId)
    .query(
      `SELECT 1 FROM dbo.Seguidores WHERE seguidorId=@seguidorId AND seguidoId=@seguidoId`
    );
  res.json({ following: r.recordset.length > 0 });
});

/* Curtidas */

// curtir
app.post("/posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { usuarioId } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("postId", sql.UniqueIdentifier, postId)
      .input("usuarioId", sql.UniqueIdentifier, usuarioId).query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.PostLikes
                       WHERE postId = @postId AND usuarioId = @usuarioId)
        BEGIN
          INSERT dbo.PostLikes (postId, usuarioId) VALUES (@postId, @usuarioId);
        END
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// remover like
app.delete("/posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { usuarioId } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("postId", sql.UniqueIdentifier, postId)
      .input("usuarioId", sql.UniqueIdentifier, usuarioId).query(`
        DELETE dbo.PostLikes
        WHERE postId = @postId AND usuarioId = @usuarioId
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

/* Comentarios */

// listar comentários de um post
app.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const pool = await poolPromise;
  const r = await pool.request().input("postId", sql.UniqueIdentifier, postId)
    .query(`
            SELECT c.id, c.texto, c.createdAt,
                   u.id   AS autorId, u.nome, u.sobrenome, u.fotoPerfil
            FROM dbo.Comentarios c
            JOIN dbo.Usuarios    u ON u.id = c.usuarioId
            WHERE c.postId = @postId
            ORDER BY c.createdAt ASC
          `);
  res.json(r.recordset);
});

// inserir comentário
app.post("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { usuarioId, texto } = req.body;

  if (!texto?.trim()) {
    return res.status(400).json({ message: "Comentário vazio" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, uuidv4())
      .input("postId", sql.UniqueIdentifier, postId)
      .input("usuarioId", sql.UniqueIdentifier, usuarioId)
      .input("texto", sql.NVarChar, texto.trim()).query(`
        INSERT dbo.Comentarios (id, postId, usuarioId, texto, createdAt)
        VALUES (@id, @postId, @usuarioId, @texto, GETUTCDATE())
      `);

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
