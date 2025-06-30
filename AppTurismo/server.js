require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("./src/db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API TCC está ativa!");
});

// CREATE – Cadastro de usuário
app.post("/users", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }
  try {
    const pool = await poolPromise;
    const senhaHash = await bcrypt.hash(senha, 10);
    await pool
      .request()
      .input("nome", sql.NVarChar, nome)
      .input("email", sql.NVarChar, email)
      .input("senhaHash", sql.NVarChar, senhaHash).query(`
        INSERT INTO Usuarios (nome, email, senhaHash)
        VALUES (@nome, @email, @senhaHash)
      `);
    console.log("Usuário criado:", email);
    res.status(201).json({ message: "Usuário criado com sucesso" });
  } catch (err) {
    console.error("Erro no cadastro:", err);
    if (err.number === 2627) {
      res.status(409).json({ message: "E-mail já cadastrado" });
    } else {
      res.status(500).json({ message: "Erro interno" });
    }
  }
});

// READ – Listar todos os usuários
app.get("/users", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT id, nome, email, fotoPerfil, tipo FROM Usuarios");
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

// READ – Obter um usuário pelo ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .query(
        "SELECT id, nome, email, fotoPerfil, tipo FROM Usuarios WHERE id = @id"
      );
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).json({ message: "Erro interno" });
  }
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
  const { nome, fotoPerfil, tipo } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("nome", sql.NVarChar, nome)
      .input("fotoPerfil", sql.NVarChar, fotoPerfil)
      .input("tipo", sql.Int, tipo).query(`
        UPDATE Usuarios
        SET nome = @nome,
            fotoPerfil = @fotoPerfil,
            tipo = @tipo
        WHERE id = @id
      `);
    console.log("Usuário atualizado:", id);
    res.json({ message: "Usuário atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ message: "Erro interno" });
  }
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

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
