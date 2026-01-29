import React, { useState, useEffect } from 'react'
import api from './config/api'
import './App.css'

const App = () => {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [showData, setShowData] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    checkBackendConnection()
  }, [])

  const checkBackendConnection = async () => {
    try {
      const response = await api.get('/api/health')
      setBackendStatus(response.message || 'Connected!')
    } catch (error) {
      setBackendStatus('Failed to connect to backend')
      console.error('Backend connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const response = await api.get('/api/data')
      setData(response.data || [])
      setShowData(true)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to fetch data from database')
    } finally {
      setDataLoading(false)
    }
  }

  // Add new item
  const handleAdd = async () => {
    if (!newName.trim()) {
      alert('Please enter a name')
      return
    }
    setActionLoading('add')
    try {
      await api.post('/api/data', { name: newName })
      setNewName('')
      setShowAddForm(false)
      await fetchData()
    } catch (error) {
      console.error('Error adding data:', error)
      alert('Failed to add data')
    } finally {
      setActionLoading(null)
    }
  }

  // Start editing
  const handleEdit = (item) => {
    setEditingId(item.id)
    setEditValue(item.name)
  }

  // Save edit
  const handleSave = async (id) => {
    if (!editValue.trim()) {
      alert('Please enter a name')
      return
    }
    setActionLoading(id)
    try {
      await api.put(`/api/data/${id}`, { name: editValue })
      setEditingId(null)
      setEditValue('')
      await fetchData()
    } catch (error) {
      console.error('Error updating data:', error)
      alert('Failed to update data')
    } finally {
      setActionLoading(null)
    }
  }

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  // Delete item
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }
    setActionLoading(id)
    try {
      await api.delete(`/api/data/${id}`)
      await fetchData()
    } catch (error) {
      console.error('Error deleting data:', error)
      alert('Failed to delete data')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>🚀 My App with ci cd workflow added </h1>
        <p className="status">
          Backend: {' '}
          <span className={backendStatus.includes('Connected') || backendStatus.includes('connected') ? 'status-ok' : 'status-error'}>
            {loading ? 'Loading...' : backendStatus}
          </span>
        </p>
      </header>

      <main className="main-content">
        <div className="card">
          <h2>Database Data</h2>
          <p>Manage your data with full CRUD operations</p>
          
          <div className="button-group">
            <button 
              className="fetch-btn"
              onClick={fetchData} 
              disabled={dataLoading}
            >
              {dataLoading ? '⏳ Loading...' : '📥 Fetch Data'}
            </button>
            
            <button 
              className="add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✕ Cancel' : '➕ Add New'}
            </button>
          </div>

          {/* Add New Form */}
          {showAddForm && (
            <div className="add-form">
              <input
                type="text"
                placeholder="Enter name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field"
              />
              <button 
                className="save-btn"
                onClick={handleAdd}
                disabled={actionLoading === 'add'}
              >
                {actionLoading === 'add' ? '⏳ Saving...' : '💾 Save'}
              </button>
            </div>
          )}

          {showData && (
            <div className="data-container">
              <h3>Results ({data.length} items)</h3>
              {data.length === 0 ? (
                <p className="no-data">No data found in the database</p>
              ) : (
                <div className="data-table">
                  <div className="table-header">
                    <span>ID</span>
                    <span>Name</span>
                    <span>Created At</span>
                    <span>Actions</span>
                  </div>
                  {data.map((item) => (
                    <div key={item.id} className="table-row">
                      <span className="cell-id">{item.id}</span>
                      <span className="cell-name">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="edit-input"
                            autoFocus
                          />
                        ) : (
                          item.name
                        )}
                      </span>
                      <span className="cell-date">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="cell-actions">
                        {editingId === item.id ? (
                          <>
                            <button 
                              className="btn-save"
                              onClick={() => handleSave(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? '⏳' : '💾 Save'}
                            </button>
                            <button 
                              className="btn-cancel"
                              onClick={handleCancel}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-edit"
                              onClick={() => handleEdit(item)}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDelete(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? '⏳' : '🗑️ Delete'}
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
