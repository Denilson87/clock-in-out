
import React, { useState } from 'react';

interface AddEmployeeProps {
  onAddSuccess: () => void;
  onCloseOverlay: () => void;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({ onAddSuccess, onCloseOverlay }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const MIN_NAME_LENGTH = 2;
  const PIN_LENGTH = 6;

  const handleAddEmployee = async () => {
    if (name.length < MIN_NAME_LENGTH) {
      setError(`Nome deve ter  ${MIN_NAME_LENGTH} caracteres`);
      return;
    }
    if (pin.length !== PIN_LENGTH) {
      setError(`PIN deve ser exacto ${PIN_LENGTH} .`);
      return;
    }

    fetch('/add-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin })
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.id) {
          onAddSuccess();
        } else {
          setError('Error adicionando colaborador: ' + data.error);
        }
      })
      .catch((error) => setError('Error adicionando colaborador: ' + error));
  };

  return (
    <div className="employee-overlay">
      <div className="employee-container">
        <button className="close-btn" onClick={onCloseOverlay}>X</button>
        <h1>Adicionar colaborador</h1>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="PIN (6 digits)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={PIN_LENGTH}
          />
        </div>
        {error && <div className="employee-error">{error}</div>}
        <button id="addEmployee" onClick={handleAddEmployee}>Adicionar colaborador</button>
      </div>
    </div>
  );
};

export default AddEmployee;
