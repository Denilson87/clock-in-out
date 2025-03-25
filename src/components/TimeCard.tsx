import React from 'react';

const now = new Date();
const formattedDate = now.toISOString().split('T')[0];

interface Record {
  id: number;
  name: string;
  pin: string;
  action: string;
  date: string; // Alterado de formattedDate para string
  time: string;
  atraso: string;
  atrasoMinutos: number; // Alterado de string para number
  ip: string;
}

interface TimeCardProps {
  records: Record[];
}

const TimeCard: React.FC<TimeCardProps> = ({ records }) => {
  const groupedRecords: { [pin: string]: { name: string; records: Record[] } } = {};
  const uniqueIps: { [pin: string]: Set<string> } = {};

  records.forEach((record) => {
    if (!groupedRecords[record.pin]) {
      groupedRecords[record.pin] = { name: record.name, records: [] };
      uniqueIps[record.pin] = new Set();
    }
    groupedRecords[record.pin].records.push(record);
    uniqueIps[record.pin].add(record.ip);
  });

  if (records.length === 0) {
    return (
      <div className="time-card">
        <p>No one has clocked in yet.</p>
      </div>
    );
  }

  return (
    <div className="time-card">
      <h2 style={{ font: 'bold 1.5rem' }}>Cartões de Ponto de Hoje</h2>
      {Object.entries(groupedRecords).map(([pin, data], index) => (
        <div key={index}>
          <h3>{data.name} - {pin}</h3>
          <table>
            <thead>
              <tr>
                <th>Acção</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Status</th>
                <th>Minutos de atraso</th>
                <th>IP</th>
                <th>Unidade sanitaria</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((record, idx) => (
                <tr key={idx}>
                  <td>{record.action}</td>
                  <td>{record.date}</td>
                  <td>{record.time}</td>
                  <td>{record.atraso}</td>
                  <td>{record.atrasoMinutos}</td>
                  <td style={{ backgroundColor: uniqueIps[pin].size > 1 ? 'yellow' : 'transparent' }}>
                    {record.ip}
                  </td>
                  <td>CS Alto Mae</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default TimeCard;
