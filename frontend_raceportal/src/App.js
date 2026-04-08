import './App.css';
import axios from 'axios';
import React, { useState } from 'react';

const api = axios.create({
  baseURL: 'http://localhost:8080/'
});

function App() {

  const isFormValid = () => {
  return form.id.length === 1
  };

  const [form, setForm] = useState({ id: 0});
  const [res, setRes] = useState(null);

  const check = async () => {
    try {
      const response = await api.post('api/test/check', form);
      setRes(response.data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong, server has an issue");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>TEST</h2>
      <input placeholder="id" onChange={e => setForm({...form, id: e.target.value})} /><br/>
      
      <button onClick={check} disabled={!isFormValid()}>Check</button>

      {res && (
        <div style={{ marginTop: '20px', border: '1px solid black', padding: '10px' }}>
          <h3>text: {res.text}</h3>
        </div>
      )}
    </div>
  );
}

export default App;
