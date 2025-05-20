import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import Lottie from 'lottie-react';
import 'react-calendar/dist/Calendar.css';
import './App.css';

import splashAnimation from './animation/loading.json';

const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tfCount, setTfCount] = useState('');
  const [daCount, setDaCount] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showLoadingText, setShowLoadingText] = useState(false);

useEffect(()=> {
  const timer = setTimeout(() => {
      setShowLoadingText(true); // hide text only
    }, 2000);

    return () => clearTimeout(timer);
})

useEffect(() => {
    axios
      .get(`${API_URL}`, {
        headers: { 'x-api-key': API_KEY },
      })
      .then((res) => {
        setLoading(false);
      })
      .catch((err) => {
        setError('Error fetching data');
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load all entries.',
        });
        setLoading(false);
      });
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    Swal.fire({
      title: 'Loading all entries...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    axios
      .get(`${API_URL}/all/data`, {
        headers: { 'x-api-key': API_KEY },
      })
      .then((res) => {
        setData(res.data);
        Swal.close();
      })
      .catch((err) => {
        setError('Error fetching data');
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load all entries.',
        });
      });
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    const formatted = format(selectedDate, 'dd/MM/yyyy');
    Swal.fire({
      title: `Fetching data...`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    axios
      .get(`${API_URL}/data?date=${formatted}`, {
        headers: { 'x-api-key': API_KEY },
      })
      .then((res) => {
        setSelectedData(res.data);
        setTfCount(res.data.tf_count);
        setDaCount(res.data.da_count);
        setMessage('Entry already exists for this date');
        Swal.close();
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setSelectedData(null);
          setTfCount('');
          setDaCount('');
          setMessage('No entry found — you can add one.');
          Swal.close();
        } else {
          setError('Error fetching selected date data');
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load selected date data.',
          });
        }
      });
  }, [selectedDate, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedDate = format(selectedDate, 'dd/MM/yyyy');

    const newData = {
      tf_count: tfCount,
      da_count: daCount,
    };

    const url = selectedData
      ? `${API_URL}/update?date=${formattedDate}`
      : `${API_URL}/add`;

    const method = selectedData ? 'put' : 'post';

    Swal.fire({
      title: 'Submitting data...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    axios({
      method: method,
      url: url,
      data: selectedData ? newData : { ...newData, date: formattedDate },
      headers: { 'x-api-key': API_KEY },
    })
      .then(() => {
        const updated = { date: formattedDate, ...newData };

        if (selectedData) {
          setData((prev) =>
            prev.map((item) =>
              item.date === formattedDate ? updated : item
            )
          );
          setMessage('Data updated successfully');
        } else {
          setData([...data, updated]);
          setMessage('Data added successfully');
        }

        setSelectedData(updated);
        setError(null);

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: selectedData ? 'Data updated!' : 'Data added!',
        });
      })
      .catch((err) => {
        setError('Error submitting data');
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong while submitting data!',
        });
      });
  };

  const handleDelete = () => {
    const formattedDate = format(selectedDate, 'dd/MM/yyyy');

    Swal.fire({
      title: 'Are you sure?',
      text: `This will delete the entry for ${formattedDate}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        axios
          .delete(`${API_URL}/delete?date=${formattedDate}`, {
            headers: { 'x-api-key': API_KEY },
          })
          .then(() => {
            setData((prev) =>
              prev.filter((item) => item.date !== formattedDate)
            );
            setSelectedData(null);
            setTfCount('');
            setDaCount('');
            setMessage('Entry deleted successfully');

            Swal.fire('Deleted!', 'The entry has been deleted.', 'success');
          })
          .catch((err) => {
            console.error(err);
            Swal.fire('Error', 'Failed to delete the entry.', 'error');
          });
      }
    });
  };

  if (loading) {
    return (
      <div className="splash-screen">
        <Lottie
          animationData={splashAnimation}
          loop={true}
          style={{ height: '50%', width: '50%' }}
        />
        {showLoadingText && <h1>Loading....</h1>}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Daily Count</h1>

      <Calendar onChange={setSelectedDate} value={selectedDate} />

      <h2>Entry for {format(selectedDate, 'dd/MM/yyyy')}</h2>
      {selectedData ? (
        <p>
          TF: {selectedData.tf_count}, DA: {selectedData.da_count}
        </p>
      ) : (
        <p>No data for this date yet.</p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="TF Count"
          value={tfCount}
          onChange={(e) => setTfCount(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="DA Count"
          value={daCount}
          onChange={(e) => setDaCount(e.target.value)}
          required
        />
        <div id="Button">
          <button type="submit">
            {selectedData ? 'Update' : 'Add Data'}
          </button>
          {selectedData && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedData(null);
                  setTfCount('');
                  setDaCount('');
                  setMessage('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="delete-button"
                style={{
                  backgroundColor: 'crimson',
                  color: 'white',
                  marginLeft: '10px',
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </form>

      {message && <p className="info">{message}</p>}
      {error && <p className="error">{error}</p>}

      <button onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Hide All Entries' : 'Show All Entries'}
      </button>

      {showAll && (
        <div id='tabledate'>
          <div>
            <h2 style={{ textAlign: 'center' }}>All Entries</h2>
            <table border="1" cellPadding= "5" style={{ margin: '0 auto', borderCollapse: 'collapse', background: "#fff"}}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>TF Count</th>
                  <th>DA Count</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.date}</td>
                    <td>{item.tf_count}</td>
                    <td>{item.da_count}</td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr>
                  <td style={{
                    background : "#28b463",
                    color : "#fff"
                  }}><strong>Total</strong></td>
                  <td style={{ background : "#aed6f1"}}><strong>{data.reduce((sum, item) => sum + item.tf_count, 0)}</strong></td>
                  <td style={{ background : "#aed6f1"}}><strong>{data.reduce((sum, item) => sum + item.da_count, 0)}</strong></td>
                </tr>

                {/* Grand Total Row */}
                <tr>
                  <td colSpan="2" style={{
                    background : "#e74c3c",
                    color : "#fff"
                  }}><strong>Grand Total (TF + DA)</strong></td>
                  <td colSpan="2" style={{
                    background : "#0e6655",
                    color : "#fff"
                  }}>
                    <strong>
                      {data.reduce((sum, item) => sum + item.tf_count + item.da_count, 0)}
                    </strong>
                  </td>
                </tr>
              </tbody>

            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
