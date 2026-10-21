import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const defaultFeedback = {
  category: 'teamwork',
  rating: '5',
  comment: '',
  anonymous: false,
};

function StudentsPage() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackState, setFeedbackState] = useState({});
  const [success, setSuccess] = useState({});

  const fetchStudents = async (query = '') => {
    try {
      setLoading(true);
      const { data } = await api.get('/users', { params: { search: query } });
      setStudents(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleFieldChange = (studentId, field, value) => {
    setFeedbackState((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || defaultFeedback),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (studentId) => {
    const payload = feedbackState[studentId] || defaultFeedback;
    const submission = {
      to: studentId,
      category: payload.category,
      rating: Number(payload.rating),
      comment: payload.comment,
      anonymous: Boolean(payload.anonymous),
    };

    try {
      setSuccess((current) => ({ ...current, [studentId]: '' }));
      const { data } = await api.post('/feedback', submission);
      setSuccess((current) => ({
        ...current,
        [studentId]: 'Feedback sent successfully.',
      }));

      setFeedbackState((current) => ({
        ...current,
        [studentId]: {
          ...defaultFeedback,
          category: 'teamwork',
          rating: '5',
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit feedback.');
      setSuccess((current) => ({ ...current, [studentId]: '' }));
    }
  };

  const profileText = useMemo(
    () => (students.length === 1 ? '1 student found' : `${students.length} students found`),
    [students.length]
  );

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Students</h2>
        <div className="input-group">
          <label htmlFor="search">Search by name</label>
          <input
            id="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students"
          />
        </div>
      </div>

      <div className="content-grid" style={{ marginTop: '20px' }}>
        {error && <div className="message error">{error}</div>}

        {loading ? (
          <div className="card">Loading students...</div>
        ) : (
          <>
            <div className="small-text">{profileText}</div>
            <div className="student-list">
              {students.map((student) => {
                const formState = feedbackState[student._id] || defaultFeedback;
                const message = success[student._id];

                return (
                  <div key={student._id} className="student-item">
                    <div className="student-header">
                      <div>
                        <strong>{student.name}</strong>
                        <div className="small-text">
                          {student.department} · Year {student.year}
                        </div>
                      </div>
                    </div>

                    <form className="feedback-form" onSubmit={(event) => {
                      event.preventDefault();
                      handleSubmit(student._id);
                    }}>
                      <div className="inline-row">
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>Category</label>
                          <select
                            value={formState.category}
                            onChange={(event) => handleFieldChange(student._id, 'category', event.target.value)}
                          >
                            <option value="teamwork">Teamwork</option>
                            <option value="communication">Communication</option>
                            <option value="technical">Technical</option>
                            <option value="helpfulness">Helpfulness</option>
                          </select>
                        </div>

                        <div className="input-group" style={{ width: '130px' }}>
                          <label>Rating</label>
                          <select
                            value={formState.rating}
                            onChange={(event) => handleFieldChange(student._id, 'rating', event.target.value)}
                          >
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <option key={rating} value={rating}>
                                {rating}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Comment</label>
                        <textarea
                          value={formState.comment}
                          maxLength={500}
                          onChange={(event) => handleFieldChange(student._id, 'comment', event.target.value)}
                          placeholder="Share specific feedback"
                        />
                        <div className="small-text">{formState.comment.length}/500</div>
                      </div>

                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={Boolean(formState.anonymous)}
                          onChange={(event) => handleFieldChange(student._id, 'anonymous', event.target.checked)}
                        />
                        Send anonymously
                      </label>

                      {message && <div className="message success">{message}</div>}

                      <button className="primary-btn" type="submit">
                        Give feedback
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StudentsPage;
