import express from 'express';

import cors from 'cors';

import bodyParser from 'body-parser';

import bcrypt from 'bcryptjs';

import { pool } from './db.js';



const app = express();

app.use(cors());

app.use(bodyParser.json());



const PORT = process.env.PORT || 5000;



// Create users table if not exists

pool.query(`CREATE TABLE IF NOT EXISTS users (

  id SERIAL PRIMARY KEY,

  email TEXT UNIQUE NOT NULL,

  password TEXT NOT NULL,

  balance FLOAT DEFAULT 0,

  investment FLOAT DEFAULT 0

)`);



// Signup/Login

app.post('/auth', async (req,res)=>{

  const { action, email, password } = req.body;

  if(!email || !password) return res.status(400).json({error:'Missing fields'});



  if(action==='signup'){

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(

      'INSERT INTO users(email,password,balance,investment) VALUES($1,$2,0,0) RETURNING id,email,balance,investment',

      [email,hashed]

    );

    res.json(result.rows[0]);

  } else if(action==='login'){

    const result = await pool.query('SELECT * FROM users WHERE email=$1',[email]);

    if(!result.rows[0]) return res.status(400).json({error:'User not found'});

    const match = await bcrypt.compare(password,result.rows[0].password);

    if(!match) return res.status(400).json({error:'Invalid password'});

    res.json(result.rows[0]);

  } else {

    res.status(400).json({error:'Invalid action'});

  }

});



// Deposit

app.post('/deposit', async(req,res)=>{

  const { userId, amount } = req.body;

  if(!userId || !amount) return res.status(400).json({error:'Missing fields'});

  await pool.query('UPDATE users SET balance = balance + $1 WHERE id=$2',[amount,userId]);

  const result = await pool.query('SELECT balance,investment FROM users WHERE id=$1',[userId]);

  res.json(result.rows[0]);

});



// Withdraw

app.post('/withdraw', async(req,res)=>{

  const { userId, amount } = req.body;

  if(!userId || !amount) return res.status(400).json({error:'Missing fields'});

  const user = await pool.query('SELECT balance FROM users WHERE id=$1',[userId]);

  if(user.rows[0].balance < amount) return res.status(400).json({error:'Insufficient balance'});

  await pool.query('UPDATE users SET balance = balance - $1 WHERE id=$2',[amount,userId]);

  const result = await pool.query('SELECT balance,investment FROM users WHERE id=$1',[userId]);

  res.json(result.rows[0]);

});



// Invest

app.post('/invest', async(req,res)=>{

  const { userId, amount } = req.body;

  if(!userId || !amount) return res.status(400).json({error:'Missing fields'});

  const user = await pool.query('SELECT balance,investment FROM users WHERE id=$1',[userId]);

  if(user.rows[0].balance < amount) return res.status(400).json({error:'Insufficient balance'});

  await pool.query('UPDATE users SET balance = balance - $1, investment = investment + $1 WHERE id=$2',[amount,userId]);

  const result = await pool.query('SELECT balance,investment FROM users WHERE id=$1',[userId]);

  res.json(result.rows[0]);

});



app.listen(PORT, ()=>console.log(`Backend running on port ${PORT}`));




