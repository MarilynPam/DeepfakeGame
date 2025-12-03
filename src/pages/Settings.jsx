import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../context/AuthContext';
import Runner from '../components/Runner';
import { 
  updateUsername, 
  updateEmail,
  updatePassword, 
  deactivateAccount,
  getEmail

  
} from '../api';

import { useNavigate } from 'react-router-dom';

export function Settings () {
  const { user, signIn, signOut } = useAuth()
  // User data state
  const [username, setUsername] = useState(user?.username || '');
  const [newUsername, setNewUsername] = useState("");

  const [email, setEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState("");

  const navigate = useNavigate()

 
  // Edit states
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [canChangeEmail, setCanChangeEmail] = useState(true);
  const [emailWarningAcknowledged, setEmailWarningAcknowledged] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [activeSection, setActiveSection] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  


  useEffect(() => {
    if (user) {
      setUsername(user?.username || '');
      setEmail(user?.email || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.user_id) {
        try {
          const fetchedEmail = await getEmail(user.user_id);
          setEmail(fetchedEmail);
        } catch (error) {
          console.error("Failed to load user email:", error);
        }
      }
    };
    
    fetchUserData();
  }, [user]);


  // Handle username update
  const handleUsernameUpdate = async (new_username) => {
    setLoading(true);

    try {
      if (!currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required' });
        setLoading(false);
        return;
      }
      
      const response = await updateUsername(
        user?.username, 
        currentPassword, 
        new_username
      );

      
      signIn({username: newUsername, user_id: user.user_id});
      setMessage({ type: 'success', text: 'Username updated successfully' });
      setEditingUsername(false);
      setCurrentPassword('');
      setUsername(new_username);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update username' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fix the email update handler
const handleEmailUpdate = async () => {
  setLoading(true);
  
  try {
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      setLoading(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setMessage({type: 'error', text: "Please enter a valid email address."});
      setLoading(false);
      return;
    }

    // Get current email if needed, but don't directly modify the variable
    
    const response = await updateEmail(
      user?.username,
      currentPassword,
      email,        // Use the current email 
      newEmail     // Use the newEmail state
    );
    
    // Record email change date
  //  localStorage.setItem('lastEmailChange', new Date().toISOString());
   // setCanChangeEmail(false); // You've just changed it, so set to false
    
    setMessage({ type: 'success', text: 'Email updated successfully' });
    setEditingEmail(false);
    setCurrentPassword('');
    setEmail(newEmail); // Update the email state
    setNewEmail(''); // Clear the new email input
  } catch (error) {
    setMessage({ 
      type: 'error', 
      text: error.message || 'Failed to update email' 
    });
  } finally {
    setLoading(false);
  }
};

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    if (newPassword.length < 10) {
      setMessage({ type: 'error', text: 'Password must be at least 10 characters' });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await updatePassword(
        user?.username,
        currentPassword,
        newPassword
      );
      
      // Check if the response was successful
      if (response.message === "Password updated successfully.") {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        signOut();
        
        // Keep the user signed in by refreshing the auth context

        if (user) {
          signIn({...user}); // This refreshes the localStorage entry
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: response.detail || 'Failed to update password' 
        });
      }
    } catch (error) {
      // Make sure we're only using the error message as a string
      const errorMessage = typeof error.message === 'string' 
        ? error.message 
        : 'Failed to update password';
        
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    }finally {
      setLoading(false);
    }
  };

// Handle account deactivation
const handleDeactivateAccount = async () => {
  setLoading(true);

  if (!currentPassword) {
    setMessage({ type: 'error', text: 'Current password is required' });
    setLoading(false);
    return;
  }
  
  try {
   // console.log("Attempting to deactivate account for:", user?.username);
   // console.log("Sending request with:", user?.username, currentPassword);

    const response = await deactivateAccount(
      user?.username, 
      currentPassword
    );
    
   // console.log("Deactivation response:", response);

    setMessage({ type: 'success', text: 'Account deactivated successfully' });
    signOut(); // Make sure to sign out after deactivation
    navigate("/"); // Navigate to home page
  } catch (error) {
    setMessage({ 
      type: 'error', 
      text: error.message || 'Failed to deactivate account' 
    });
  } finally {
    setLoading(false);
    setConfirmDeactivate(false);
  }
};



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-4 font-mono"> {/* Page container. Define bckgrnd, text, and font */}
      <h1 className="text-2xl font-bold mb-6 text-white">Account Settings</h1>
      
      {/* Alert Message */}
      {message.text && (
        <div 
          className={`p-4 mb-6 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      
      {/* Section Navigation */}
      <div className="flex mb-6 gap-5">
        <button 
          className={`py-2 px-4 ${activeSection === 'profile' ? 'border-b-2 border-indigo-600 text-indigo-600' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          Profile
        </button>
        <button 
          className={`py-2 px-4 ${activeSection === 'security' ? 'border-b-2 border-indigo-600 text-indigo-600' : ''}`}
          onClick={() => setActiveSection('security')}
        >
          Security
        </button>
        <button 
          className={`py-2 px-4 ${activeSection === 'deactivate' ? 'border-b-2 border-red-500 text-red-500' : ''}`}
          onClick={() => setActiveSection('deactivate')}
        >
          Deactivate Account
        </button>
      </div>
      
      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div>
          <div className="mb-6 mt-2">
            <div className="flex items-center justify-between mb-2 gap-10">
              <h3 className="font-semibold text-gray-300">Username Update</h3>
              {!editingUsername && (
                <button
                  className="text-indigo-700 hover:text-indigo-500 "
                  onClick={() => setEditingUsername(true)}
                >
                  Edit
                </button>
              )}
            </div>
            
            {editingUsername ? (
              <div>
                <div className="flex mb-2">
                  <input
                    type="text"
                    className="flex-grow p-2 border rounded mr-2 bg-white text-black"
                    value={newUsername}
                    placeholder='Enter new username'
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <button 
                    className="bg-green-600 text-white px-3 rounded hover:bg-green-500"
                    onClick={() => handleUsernameUpdate(newUsername)}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button 
                    className="bg-gray-300 text-black px-3 rounded hover:bg-gray-400 ml-2"
                    onClick={() => {
                      setEditingUsername(false);
                      setUsername(user?.username); // Reset to original
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div className="mb-2">
                  <input
                    type="password"
                    className="w-full p-2 border rounded text-black bg-white"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to confirm"
                    required
                  />
                </div>
              </div>
            ) : (
              <p className="p-2 bg-gray-100 rounded">{username}</p>
            )}
            
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-300">Email Update</h3>
              {!editingEmail && canChangeEmail && (
                <button
                  className="text-indigo-700 hover:text-indigo-500"
                  onClick={() => setEmailWarningAcknowledged(true)}
                >
                  Edit
                </button>
              )}
              {emailWarningAcknowledged && !editingEmail && (
                <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-2">
                  <p>
                    Are you sure you want to edit your email?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button 
                      className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-500"
                      onClick={() => {
                        setEditingEmail(true);
                        setEmailWarningAcknowledged(false);
                      }}
                    >
                      Yes, continue
                    </button>
                    <button 
                      className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
                      onClick={() => setEmailWarningAcknowledged(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {!canChangeEmail && (
                <span className="text-sm text-gray-500">
                </span>
              )}
            </div>
            
            {editingEmail ? (
              <div>
                <div className="flex mb-2">
                  <input
                    type="email"
                    className="flex-grow p-2 border rounded mr-2 text-black bg-white"
                    placeholder='Enter new email'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <button 
                    className="bg-green-600 text-white px-3 rounded hover:bg-green-500"
                    onClick={() => handleEmailUpdate(newEmail)}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button 
                    className="bg-gray-300 text-black px-3 rounded hover:bg-gray-400 ml-2"
                    onClick={() => {
                      setEditingEmail(false);
                      setEmail(user?.email); // Reset to original
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div className="mb-2">
                  <input
                    type="password"
                    className="w-full p-2 border rounded text-black bg-white"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to confirm"
                    required
                  />
                </div>
              </div>
            ) : (
              <p className="p-2 bg-gray-100 rounded">{email}</p>
            )}
          </div>
          <div className='flex justify-center'>
          <button
            type="button"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
            onClick={() => signOut()}
          >
            Sign Out
          </button>
            </div>
        </div>
      )}
      
      {/* Security Section */}
      {activeSection === 'security' && (
        <form onSubmit={handlePasswordUpdate}>
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Change Password</h2>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="current-password">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              className="w-full p-2 border rounded text-black bg-white"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 " htmlFor="new-password">
              New Password
            </label>
              <input
              id="new-password"
              type="password"
              className="w-full p-2 border rounded text-black bg-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
            />
            <p className="text-sm text-gray-500 mt-1 ">
              Password must be at least 10 characters long.
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="w-full p-2 border rounded text-black bg-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
      
      {/* Deactivate Account Section */}
      {activeSection === 'deactivate' && (
        <div className="border border-red-300 rounded p-4 bg-red-50">
          <h2 className="text-xl font-semibold text-red-600 mb-4 text-center">Deactivate Account</h2>
          
          {!confirmDeactivate ? (
            <div>
              <p className="mb-4">
                Deactivating your account will permanently remove all your data. This action cannot be undone.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                  onClick={() => setConfirmDeactivate(true)}
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 font-bold">
                Are you absolutely sure you want to deactivate your account?
              </p>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="deactivate-password">
                  Enter your password to confirm
                </label>
                <input
                  id="deactivate-password"
                  type="password"
                  className="w-full p-2 border rounded text-black bg-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                  onClick={handleDeactivateAccount}
                  disabled={loading || !currentPassword}
                >
                  {loading ? 'Processing...' : 'Confirm Deactivation'}
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => {
                    setConfirmDeactivate(false);
                    setCurrentPassword('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    <Runner/>
    </div>
  );
};

export default Settings;