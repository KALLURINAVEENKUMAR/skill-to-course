import React, { useState } from 'react';
import './App.css';
import { skillCourseMap } from './data/skillCourseData';
// import OpenAI from 'openai'; // Uncomment when you have API key

const levelOrder = { "Beginner": 0, "Intermediate": 1, "Advanced": 2 };

// OpenAI configuration (add your API key to .env file)
// const openai = new OpenAI({
//   apiKey: process.env.REACT_APP_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true
// });

// Function to generate dynamic skill path using GPT
const generateSkillPath = async (jobTitle) => {
  try {
    const prompt = `Generate a learning roadmap for "${jobTitle}" with 4-6 skills. 
    Return ONLY a JSON array with this exact format:
    [
      {
        "skill": "Skill Name",
        "course": "https://example.com/course",
        "level": "Beginner"
      }
    ]
    
    Use these course platforms: Coursera, freeCodeCamp, YouTube, Khan Academy, edX.
    Levels: Beginner, Intermediate, Advanced.
    Focus on free courses.`;

    // Uncomment when you have OpenAI API key
    // const response = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0.7,
    //   max_tokens: 1000
    // });

    // const skillsData = JSON.parse(response.choices[0].message.content);
    // return skillsData;

    // Mock response for demonstration (remove when using real API)
    return [
      {
        skill: `${jobTitle} Fundamentals`,
        course: "https://www.freecodecamp.org/learn/",
        level: "Beginner"
      },
      {
        skill: `Advanced ${jobTitle} Techniques`,
        course: "https://www.coursera.org/",
        level: "Advanced"
      }
    ];
  } catch (error) {
    console.error('Error generating skill path:', error);
    return null;
  }
};

// Function to check if search term matches job title (fuzzy matching)
const fuzzyMatch = (searchTerm, jobTitle) => {
  const search = searchTerm.toLowerCase().trim();
  const title = jobTitle.toLowerCase();
  
  // Exact match
  if (title.includes(search)) return true;
  
  // Check individual words
  const searchWords = search.split(' ');
  const titleWords = title.split(' ');
  
  return searchWords.some(searchWord => 
    titleWords.some(titleWord => 
      titleWord.includes(searchWord) || searchWord.includes(titleWord)
    )
  );
};

// Get job title recommendations
const getRecommendations = (searchTerm) => {
  if (!searchTerm.trim()) return [];
  
  return Object.keys(skillCourseMap).filter(jobTitle => 
    fuzzyMatch(searchTerm, jobTitle)
  );
};

function App() {
  const [jobTitle, setJobTitle] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [skills, setSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDynamicGeneration, setIsDynamicGeneration] = useState(false);
  const [showCgpaWarning, setShowCgpaWarning] = useState(false);

  // CGPA validation and warning with 3-second auto-hide
  const handleCgpaChange = (e) => {
    const value = e.target.value;
    setCgpa(value);
    
    if (value && parseFloat(value) < 9.0) {
      setShowCgpaWarning(true);
      // Auto-hide warning after 3 seconds
      setTimeout(() => {
        setShowCgpaWarning(false);
      }, 3000);
    } else {
      setShowCgpaWarning(false);
    }
  };

  const handleSearch = async () => {
    // Validate CGPA first
    if (!cgpa || cgpa < 0 || cgpa > 10) {
      alert('Please enter a valid CGPA between 0 and 10');
      return;
    }

    const normalized = jobTitle.trim().toLowerCase();
    setLoading(true);
    
    // Try exact match first in predefined data
    let found = Object.keys(skillCourseMap).find(
      key => key.toLowerCase() === normalized
    );
    
    // If no exact match, try fuzzy matching
    if (!found) {
      const matches = getRecommendations(jobTitle);
      if (matches.length === 1) {
        found = matches[0];
      } else if (matches.length > 1) {
        setRecommendations(matches);
        setSkills([]);
        setLoading(false);
        return;
      }
    }
    
    if (found) {
      // Use predefined data
      const sortedSkills = [...skillCourseMap[found]].sort(
        (a, b) => levelOrder[a.level] - levelOrder[b.level]
      );
      setSkills(sortedSkills);
      setRecommendations([]);
      setIsDynamicGeneration(false);
    } else {
      // Generate dynamic skill path using AI
      const dynamicSkills = await generateSkillPath(jobTitle);
      if (dynamicSkills) {
        const sortedSkills = dynamicSkills.sort(
          (a, b) => levelOrder[a.level] - levelOrder[b.level]
        );
        setSkills(sortedSkills);
        setIsDynamicGeneration(true);
      } else {
        setSkills([]);
      }
      setRecommendations([]);
    }
    
    setLoading(false);
  };

  const handleRecommendationClick = (selectedTitle) => {
    setJobTitle(selectedTitle);
    const sortedSkills = [...skillCourseMap[selectedTitle]].sort(
      (a, b) => levelOrder[a.level] - levelOrder[b.level]
    );
    setSkills(sortedSkills);
    setRecommendations([]);
    setIsDynamicGeneration(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setJobTitle(value);
    
    if (value.trim().length > 1) {
      const recs = getRecommendations(value);
      setRecommendations(recs.slice(0, 5));
    } else {
      setRecommendations([]);
    }
    
    if (skills.length > 0) {
      setSkills([]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>🎯 AI-Powered Skill-to-Course Mapper</h2>
        <p style={{ fontSize: '14px', color: '#bbb', marginBottom: '20px' }}>
          Get personalized learning paths for any job title
        </p>
        
        {/* Input Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          {/* CGPA Input */}
          <div style={{ position: 'relative', marginBottom: showCgpaWarning ? '80px' : '0px' }}>
            <input
              type="number"
              placeholder="Enter your CGPA (0-10)"
              value={cgpa}
              onChange={handleCgpaChange}
              min="0"
              max="10"
              step="0.1"
              style={{ 
                padding: '12px', 
                fontSize: '16px', 
                width: '250px', 
                borderRadius: '6px', 
                border: showCgpaWarning ? '2px solid #ff6b6b' : '1px solid #61dafb',
                marginRight: '10px'
              }}
            />
            
            {/* CGPA Warning - Fixed positioning */}
            {showCgpaWarning && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: '#ff6b6b',
                color: 'white',
                padding: '10px',
                borderRadius: '6px',
                marginTop: '5px',
                fontSize: '14px',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                maxWidth: '350px', // Prevent overflow
                animation: 'fadeIn 0.3s ease-in'
              }}>
                ⚠️ <strong>Warning:</strong> With CGPA below 9.0, you need to work extra hard in this competitive job market! 
                <br />
                <span style={{ fontSize: '13px', fontStyle: 'italic' }}>
                  Remember: CGPA is not mandatory if you have skills - skills are most important! 
                  But for shortlisting, HR's see CGPA first 🫠
                </span>
              </div>
            )}
          </div>

          {/* Job Title Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Enter any job title (e.g., Data Analyst, UX Designer, Blockchain Developer)"
              value={jobTitle}
              onChange={handleInputChange}
              style={{ 
                padding: '12px', 
                fontSize: '16px', 
                width: '400px', 
                borderRadius: '6px', 
                border: '1px solid #61dafb' 
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !cgpa || !jobTitle}
              style={{ 
                marginLeft: '10px', 
                padding: '12px 20px', 
                fontSize: '16px',
                background: (loading || !cgpa || !jobTitle) ? '#666' : '#61dafb',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: (loading || !cgpa || !jobTitle) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔍 Generating...' : '🚀 Search'}
            </button>
            
            {/* Recommendations dropdown */}
            {recommendations.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#20232a',
                border: '1px solid #61dafb',
                borderRadius: '4px',
                marginTop: '4px',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRecommendationClick(rec)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: idx < recommendations.length - 1 ? '1px solid #444' : 'none',
                      color: '#61dafb'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div style={{ marginTop: '32px', width: '100%', maxWidth: '500px' }}>
          {skills.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <h3>Learning Roadmap for <span style={{ color: '#61dafb' }}>{jobTitle}</span></h3>
                {isDynamicGeneration && (
                  <span style={{ 
                    background: '#4CAF50', 
                    color: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    🤖 AI Generated
                  </span>
                )}
              </div>

              {/* CGPA-based motivation message */}
              {cgpa && parseFloat(cgpa) < 9.0 && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)', 
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  💪 <strong>Stay Motivated!</strong> Your CGPA is {cgpa}, but remember - skills and projects matter more than grades! 
                  <br />
                  <span style={{ fontSize: '13px', marginTop: '5px', display: 'block' }}>
                    <em>Reality check: CGPA isn't mandatory if you have skills - skills are most important! 
                    But for shortlisting, HR's see CGPA first 🫠</em>
                  </span>
                  <br />
                  Complete these courses, build projects, and show your passion. Many successful developers started with lower grades!
                </div>
              )}

              {cgpa && parseFloat(cgpa) >= 9.0 && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', 
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  🌟 <strong>Excellent CGPA!</strong> With your {cgpa} CGPA, you're well-positioned for this career. 
                  Complete these skills to become even more competitive!
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {skills.map((item, idx) => (
                  <div
                    key={item.skill}
                    style={{
                      background: 'linear-gradient(135deg, #20232a 0%, #2d3748 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      border: '1px solid #444',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '15px',
                      background: getLevelColor(item.level),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.level}
                    </div>
                    
                    <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
                      {idx + 1}. {item.skill}
                    </div>
                    
                    <a
                      href={item.course}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#61dafb', 
                        textDecoration: 'none', 
                        fontSize: '15px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 12px',
                        background: 'rgba(97, 218, 251, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(97, 218, 251, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(97, 218, 251, 0.2)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(97, 218, 251, 0.1)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      📚 Start Learning
                    </a>
                  </div>
                ))}
              </div>
              
              {isDynamicGeneration && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: 'rgba(76, 175, 80, 0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  fontSize: '14px',
                  color: '#4CAF50'
                }}>
                  🤖 This roadmap was dynamically generated using AI based on your job title. 
                  The courses are curated suggestions - verify links before starting.
                </div>
              )}
            </div>
          ) : (
            jobTitle && !loading && recommendations.length === 0 && 
            <div style={{ color: 'salmon', marginTop: '16px' }}>
              No roadmap found for "{jobTitle}". Our AI will generate a custom learning path for you!
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

// Helper function for level colors
const getLevelColor = (level) => {
  switch(level) {
    case 'Beginner': return '#4CAF50';
    case 'Intermediate': return '#FF9800';
    case 'Advanced': return '#F44336';
    default: return '#757575';
  }
};

export default App;
