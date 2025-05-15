import React, { useEffect, useState } from 'react';

export default function UsersTab() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  return (
    <div>
      <h2>User List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(user => (
          <li key={user.id} style={{
            background: '#def',
            padding: '10px',
            margin: '5px 0',
            borderRadius: '5px'
          }}>
            👤 {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
