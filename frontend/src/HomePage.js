import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const SunIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> );
const MoonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> );

function HomePage({ theme, toggleTheme }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const startInterview = async () => {
    setIsUploading(true);
    setUploadError('');

    if (resumeFile) {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      try {
        const response = await fetch('http://localhost:3001/api/upload-resume', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload resume.');
        }

        console.log("Resume uploaded and processed successfully.");
        navigate('/interview');

      } catch (error) {
        console.error(error);
        setUploadError('Error processing resume. Please try again.');
        setIsUploading(false);
      }
    } else {
      console.log("Starting interview without a resume.");
      navigate('/interview');
    }
  };

  const triggerFileSelect = () => {
    document.getElementById('resume-upload').click();
  };

  const clearResume = (e) => {
    e.stopPropagation(); // Prevent the file select dialog from opening
    setResumeFile(null);
    // Reset the file input so the user can select the same file again
    document.getElementById('resume-upload').value = null; 
  };

  return (
    <div className="home-container">
      <button onClick={toggleTheme} className="theme-toggle-icon">
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>

      <div className="home-content-wrapper">
        <div className="home-content">
            <h1>AI Interview Practice</h1>
            <p>Select your desired role to begin the interview.</p>
            <div className="role-buttons">
                <button onClick={startInterview} className="role-button" disabled={isUploading}>
                    {isUploading ? 'Processing...' : 'Software Engineer'}
                </button>
                <button className="role-button disabled" disabled>Game Developer (soon)</button>
            </div>

            <div className="upload-section">
                <input type="file" id="resume-upload" onChange={handleFileChange} accept=".pdf" />
                <div className="upload-box" onClick={triggerFileSelect}>
                    {resumeFile ? (
                        <div className="selected-file-container">
                            <p><span>{resumeFile.name}</span></p>
                            <button onClick={clearResume} className="delete-resume-button">&times;</button>
                        </div>
                    ) : (
                        <p><span>Upload a PDF resume</span> (optional)</p>
                    )}
                </div>
                {uploadError && <p style={{color: 'red', marginTop: '10px'}}>{uploadError}</p>}
                <button onClick={startInterview} className="skip-button" disabled={isUploading}>
                    or proceed without a resume
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;