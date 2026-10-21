import { useEffect, useState } from 'react';
import api from '../api/axios';

const categoryLabels = {
  teamwork: 'Teamwork',
  communication: 'Communication',
  technical: 'Technical',
  helpfulness: 'Helpfulness',
};

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('received');
  const [received, setReceived] = useState({
    feedback: [],
    overallAverage: 0,
    feedbackCount: 0,
    categoryAverage: {},
  });
  const [given, setGiven] = useState({ feedback: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [receivedResponse, givenResponse] = await Promise.all([
          api.get('/feedback/received'),
          api.get('/feedback/given'),
        ]);

        setReceived(receivedResponse.data);
        setGiven(givenResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="page-shell centered">Loading dashboard...</div>;
  }

  return (
    <div className="page-shell">
      <div className="dashboard-header">
        <h1>Feedback dashboard</h1>
        <div className="tabs" style={{ minWidth: '260px' }}>
          <button
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('received')}
          >
            Received
          </button>
          <button
            className={`tab-btn ${activeTab === 'given' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('given')}
          >
            Given
          </button>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}

      {activeTab === 'received' && (
        <>
          <div className="summary-grid">
            <div className="summary-box">
              <h3>Average rating</h3>
              <strong>{received.overallAverage.toFixed(2)}</strong>
            </div>
            <div className="summary-box">
              <h3>Total feedback</h3>
              <strong>{received.feedbackCount}</strong>
            </div>
          </div>

          <div className="card">
            <h3>Category breakdown</h3>
            <div className="category-list">
              {Object.entries(received.categoryAverage || {}).map(([key, value]) => (
                <div key={key} className="category-item">
                  <span>{categoryLabels[key] || key}</span>
                  <span>
                    {value.average.toFixed(2)} / {value.count} feedback
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="feedback-list" style={{ marginTop: '20px' }}>
            {received.feedback.length === 0 ? (
              <div className="card">No feedback received yet.</div>
            ) : (
              received.feedback.map((item) => (
                <div key={item._id} className="feedback-item">
                  <div className="feedback-meta">
                    <span className="pill">{categoryLabels[item.category] || item.category}</span>
                    <strong>{item.rating}/5</strong>
                  </div>
                  <div className="small-text">
                    {item.from ? `From: ${item.from.name}` : 'From: Anonymous'}
                  </div>
                  <p>{item.comment}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'given' && (
        <div className="feedback-list">
          {given.feedback.length === 0 ? (
            <div className="card">No feedback given yet.</div>
          ) : (
            given.feedback.map((item) => (
              <div key={item._id} className="feedback-item">
                <div className="feedback-meta">
                  <span className="pill">{categoryLabels[item.category] || item.category}</span>
                  <strong>{item.rating}/5</strong>
                </div>
                <div className="small-text">
                  To: {item.to?.name || 'Unknown'}
                </div>
                <p>{item.comment}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
