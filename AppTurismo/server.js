require("dotenv").config();
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
app.get("/posts", async (_req, res) => {
  try {
    const pool = await poolPromise;
    const r = await pool.request().query(`
      SELECT  p.id, p.imagemUrl, p.legenda, p.createdAt, p.likes,
              u.nome, u.sobrenome, u.fotoPerfil
      FROM dbo.Posts p
      JOIN dbo.Usuarios u ON u.id = p.usuarioId
      ORDER BY p.createdAt DESC;
    `);
    res.json(r.recordset);
  } catch (err) {
    res.status(500).json({ message: "Erro interno" });
  }
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
