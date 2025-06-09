import React, { useState, useEffect } from 'react';
import './App.css';
import { skillCourseMap } from './data/skillCourseData';
import { leetcodeProblems } from './data/leetcodeProblems';
import emailjs from 'emailjs-com'; // Add this import

const levelOrder = { "Beginner": 0, "Intermediate": 1, "Advanced": 2 };

// Function to generate dynamic skill path and explanations using GPT
const generateSkillPath = async (jobTitle) => {
  try {
    const sampleResponses = {
      "Full Stack Developer": [
        {
          skill: "HTML & CSS",
          course: "https://www.freecodecamp.org/learn/responsive-web-design/",
          level: "Beginner",
          importance: "HTML and CSS are the foundational languages of the web. They're essential for creating the structure and appearance of websites, and mastering them is the first step to understanding how the web works."
        },
        {
          skill: "JavaScript",
          course: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
          level: "Beginner",
          importance: "JavaScript is the language of interactivity on the web. It allows you to create dynamic content that responds to user actions and is essential for modern web applications."
        },
        {
          skill: "React.js",
          course: "https://react.dev/learn",
          level: "Intermediate",
          importance: "React is one of the most in-demand frontend frameworks. It enables you to build reusable UI components and manage application state efficiently, making it easier to create complex interfaces."
        },
        {
          skill: "Node.js & Express",
          course: "https://www.youtube.com/watch?v=Oe421EPjeBE",
          level: "Intermediate",
          importance: "Node.js lets you use JavaScript for server-side development. With Express, you can quickly build APIs and backends, which completes your full-stack skillset."
        },
        {
          skill: "MongoDB",
          course: "https://www.freecodecamp.org/learn/back-end-development-and-apis/#mongodb-and-mongoose",
          level: "Intermediate",
          importance: "MongoDB is a NoSQL database that works seamlessly with JavaScript applications. Learning it gives you the ability to store and manage data, which is crucial for building complete applications."
        },
        {
          skill: "Docker & CI/CD",
          course: "https://www.coursera.org/learn/docker-kubernetes-and-helm-tools",
          level: "Advanced",
          importance: "Docker helps standardize development environments and deployment processes. Understanding containerization and CI/CD pipelines makes you a more versatile developer who can take projects from concept to production."
        }
      ],
      "Data Scientist": [
        {
          skill: "Python Programming",
          course: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
          level: "Beginner",
          importance: "Python is the primary language for data science. Its simple syntax and powerful libraries make it ideal for data manipulation, analysis, and building machine learning models."
        },
        {
          skill: "Statistics & Probability",
          course: "https://www.khanacademy.org/math/statistics-probability",
          level: "Beginner",
          importance: "Statistics forms the mathematical foundation of data science. Understanding statistical concepts is crucial for properly interpreting data, designing experiments, and drawing valid conclusions."
        },
        {
          skill: "Pandas & NumPy",
          course: "https://www.youtube.com/watch?v=vmEHCJofslg",
          level: "Intermediate",
          importance: "Pandas and NumPy are essential libraries for data manipulation in Python. They allow you to efficiently clean, transform, and analyze large datasets - a daily task for any data scientist."
        },
        {
          skill: "Machine Learning",
          course: "https://www.coursera.org/learn/machine-learning",
          level: "Intermediate",
          importance: "Machine learning is the core of modern data science. It enables you to build predictive models that can identify patterns and make data-driven decisions automatically."
        },
        {
          skill: "Data Visualization",
          course: "https://www.freecodecamp.org/learn/data-visualization/",
          level: "Intermediate",
          importance: "Data visualization is about communicating insights effectively. Strong visualization skills help you tell compelling stories with data and make your findings accessible to non-technical stakeholders."
        },
        {
          skill: "Deep Learning",
          course: "https://www.youtube.com/watch?v=tPYj3fFJGjk",
          level: "Advanced",
          importance: "Deep learning powers the most sophisticated AI systems today. Understanding neural networks allows you to work on cutting-edge problems like computer vision, natural language processing, and more."
        }
      ]
    };

    // Return sample data based on job title, or first set if not found
    const normalizedJobTitle = jobTitle.toLowerCase();
    if (normalizedJobTitle.includes("full stack") || normalizedJobTitle.includes("web")) {
      return sampleResponses["Full Stack Developer"];
    } else if (normalizedJobTitle.includes("data") || normalizedJobTitle.includes("scientist") || normalizedJobTitle.includes("analyst")) {
      return sampleResponses["Data Scientist"];
    } else {
      // Default to full stack if no match
      return sampleResponses["Full Stack Developer"];
    }

  } catch (error) {
    console.error("Error generating skill path:", error);
    return [];
  }
};

function App() {
  const [jobTitle, setJobTitle] = useState('');
  const [skills, setSkills] = useState([]);
  const [visibleSkills, setVisibleSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDynamicGeneration, setIsDynamicGeneration] = useState(false);
  const [showLeetcodeSection, setShowLeetcodeSection] = useState(true);
  const isMobile = window.innerWidth <= 768;
  const [typingIndex, setTypingIndex] = useState(-1);
  const [typedText, setTypedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    issue: ''
  });
  const [contactStatus, setContactStatus] = useState('');
  const [leetcodeSortOrder, setLeetcodeSortOrder] = useState('easy-to-hard'); // Add this line

  // Popular job titles to show on focus
  const popularJobTitles = [
    "Full Stack Developer",
    "Data Scientist", 
    "Frontend Developer",
    "Backend Developer",
    "DevOps Engineer",
    "Machine Learning Engineer",
    "UI/UX Designer",
    "Product Manager",
    "Cybersecurity Specialist",
    "Mobile App Developer",
    "Cloud Architect",
    "Business Analyst",
    "QA Engineer",
    "Database Administrator",
    "Software Engineer"
  ];

  // Auto-search effect when job title changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (jobTitle.trim().length > 2) {
        handleSearch();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [jobTitle]);

  // Staggered animation effect for roadmap skills
  useEffect(() => {
    if (skills && skills.length > 0) {
      // Reset visible skills
      setVisibleSkills([]);
      setTypingIndex(-1);
      setTypedText('');
      setCurrentCharIndex(0);
      
      // Add skills with staggered delay, ensuring each item is valid
      let index = 0;
      const interval = setInterval(() => {
        if (index < skills.length && skills[index]) {
          setVisibleSkills(prev => [...prev, skills[index]]);
          index++;
        } else {
          clearInterval(interval);
          // Start typing the first explanation
          setTimeout(() => setTypingIndex(0), 500);
        }
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [skills]);
  
  // Typewriter effect for skill importance
  useEffect(() => {
    if (typingIndex >= 0 && typingIndex < visibleSkills.length && visibleSkills[typingIndex]) {
      const currentImportance = visibleSkills[typingIndex]?.importance || '';
      
      if (currentCharIndex < currentImportance.length) {
        const timer = setTimeout(() => {
          setTypedText(prev => prev + currentImportance[currentCharIndex]);
          setCurrentCharIndex(currentCharIndex + 1);
        }, 15);
        
        return () => clearTimeout(timer);
      } else if (typingIndex < visibleSkills.length - 1) {
        const timer = setTimeout(() => {
          setTypingIndex(typingIndex + 1);
          setTypedText('');
          setCurrentCharIndex(0);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [typingIndex, currentCharIndex, visibleSkills]);

  const handleSearch = async () => {
    const normalized = jobTitle.trim().toLowerCase();
    setLoading(true);
    
    try {
      // Try exact match first in predefined data
      let found = Object.keys(skillCourseMap || {}).find(
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
          setVisibleSkills([]);
          setLoading(false);
          return;
        }
      }
      
      if (found) {
        // Use predefined data
        const rawSkills = skillCourseMap[found] || [];
        const validSkills = rawSkills
          .filter(skill => skill && typeof skill === 'object' && skill.skill)
          .map(skill => ({
            skill: skill.skill || 'Unknown Skill',
            course: skill.course || '#',
            level: skill.level || 'Beginner',
            importance: skill.importance || `${skill.skill} is a crucial skill for ${found} roles because it helps you build the foundation needed for more complex tasks.`
          }))
          .sort((a, b) => (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0));
        
        setSkills(validSkills);
        setRecommendations([]);
        setIsDynamicGeneration(false);
      } else {
        // Generate dynamic skill path using AI
        const dynamicSkills = await generateSkillPath(jobTitle);
        if (dynamicSkills && Array.isArray(dynamicSkills) && dynamicSkills.length > 0) {
          const validSkills = dynamicSkills
            .filter(skill => skill && typeof skill === 'object' && skill.skill)
            .map(skill => ({
              skill: skill.skill || 'Unknown Skill',
              course: skill.course || '#',
              level: skill.level || 'Beginner',
              importance: skill.importance || 'This skill is important for your career development.'
            }))
            .sort((a, b) => (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0));
          
          setSkills(validSkills);
          setIsDynamicGeneration(true);
        } else {
          setSkills([]);
        }
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error in handleSearch:', error);
      setSkills([]);
    }
    
    setLoading(false);
  };

  const handleInputFocus = () => {
    if (!jobTitle.trim()) {
      setRecommendations(popularJobTitles.slice(0, 8)); // Show top 8 popular titles
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events on recommendations
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleRecommendationClick = (selectedTitle) => {
    setJobTitle(selectedTitle);
    setRecommendations([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setJobTitle(value);
    setShowSuggestions(true);
    
    if (value.trim().length > 1) {
      const recs = getRecommendations(value);
      setRecommendations(recs.slice(0, 8)); // Increased to 8 suggestions
    } else if (value.trim().length === 0) {
      // Show popular titles when input is empty
      setRecommendations(popularJobTitles.slice(0, 8));
    } else {
      setRecommendations([]);
    }
    
    if (skills.length > 0) {
      setSkills([]);
      setVisibleSkills([]);
    }
  };

  // Get job title recommendations with fuzzy matching
  const getRecommendations = (searchTerm) => {
    if (!searchTerm.trim() || !skillCourseMap) return [];
    
    const searchWords = searchTerm.toLowerCase().split(/\s+/);
    
    return Object.keys(skillCourseMap).filter(jobTitle => {
      const titleWords = jobTitle.toLowerCase().split(/\s+/);
      return searchWords.some(searchWord => 
        titleWords.some(titleWord => 
          titleWord.includes(searchWord) || searchWord.includes(titleWord)
        )
      );
    });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('sending');
    
    try {
      await emailjs.send(
        'service_zld8ugb', // Replace with your EmailJS service ID
        'template_pxa3k1a', // Replace with your EmailJS template ID
        {
          from_name: contactForm.name,
          from_email: contactForm.email,
          message: contactForm.issue,
          to_name: 'Naveenkumar Kalluri'
        },
        'KCv25K18acrxF56er' // Replace with your EmailJS public key
      );
      
      setContactStatus('success');
      setContactForm({ name: '', email: '', issue: '' });
      setTimeout(() => {
        setShowContactForm(false);
        setContactStatus('');
      }, 2000);
    } catch (error) {
      console.error('Failed to send email:', error);
      setContactStatus('error');
    }
  };

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const clearJobTitle = () => {
    setJobTitle('');
    setSkills([]);
    setVisibleSkills([]);
    setRecommendations([]);
    setShowSuggestions(false);
  };

  const getSortedLeetcodeProblems = () => {
    if (!leetcodeProblems) return [];
    
    const difficultyOrder = { "Easy": 1, "Medium": 2, "Hard": 3 };
    
    return [...leetcodeProblems].sort((a, b) => {
      const diffA = difficultyOrder[a.difficulty] || 2;
      const diffB = difficultyOrder[b.difficulty] || 2;
      
      if (leetcodeSortOrder === 'easy-to-hard') {
        return diffA - diffB;
      } else {
        return diffB - diffA;
      }
    });
  };

  const styles = {
    container: {
      padding: isMobile ? '10px' : '20px',
      maxWidth: '100%',
      overflowX: 'hidden'
    },
    inputSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      alignItems: 'center',
      width: '100%',
      padding: '0 10px'
    },
    jobTitleContainer: {
      position: 'relative',
      width: isMobile ? '100%' : '400px',
    },
    jobTitleInput: {
      padding: '12px',
      fontSize: '16px',
      width: '100%',
      borderRadius: '12px',
      border: '1px solid #61dafb'
    },
    resultsSection: {
      marginTop: '32px',
      width: '100%',
      maxWidth: isMobile ? '100%' : '600px',
      padding: '0 10px'
    },
    loadingIndicator: {
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#61dafb',
      fontSize: '18px',
      gap: '10px'
    },
    importanceText: {
      color: '#BBB',
      fontSize: '14px',
      marginTop: '12px',
      lineHeight: '1.5',
      padding: '10px 15px',
      borderLeft: '3px solid rgba(97, 218, 251, 0.4)',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '0 6px 6px 0',
      minHeight: '40px'
    },
    cursor: {
      display: 'inline-block',
      width: '8px',
      height: '18px',
      background: '#61dafb',
      marginLeft: '2px',
      animation: 'blink 1s infinite'
    }
  };

  return (
    <div className="App">
      <header className="App-header" style={styles.container}>
        <h2 style={{ 
          fontSize: window.innerWidth <= 768 ? '20px' : '24px',
          textAlign: 'center',
          margin: '0 0 10px 0'
        }}>
          🎯 AI-Powered Skill-to-Course Mapper
        </h2>
        <p style={{ 
          fontSize: window.innerWidth <= 768 ? '13px' : '14px', 
          color: '#bbb', 
          marginBottom: '20px',
          textAlign: 'center',
          padding: '0 10px'
        }}>
          Type a job title to see a dynamic learning roadmap
        </p>
        
        {/* Input Section */}
        <div style={styles.inputSection}>
          <div style={styles.jobTitleContainer}>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder={window.innerWidth <= 768 ? "Enter job title (e.g., Data Analyst)" : "Enter any job title (e.g., Data Analyst, UX Designer, Blockchain Developer)"}
                value={jobTitle}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={styles.jobTitleInput}
              />
              {jobTitle && (
                <button 
                  className="clear-button"
                  onClick={clearJobTitle}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Enhanced Recommendations dropdown */}
            {recommendations.length > 0 && showSuggestions && (
              <div className="dropdown enhanced-dropdown">
                {!jobTitle.trim() && (
                  <div className="dropdown-header">
                    💼 Popular Career Paths
                  </div>
                )}
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRecommendationClick(rec)}
                    className="dropdown-item enhanced-dropdown-item"
                  >
                    <span className="dropdown-icon">
                      {!jobTitle.trim() ? '📋' : '🔍'}
                    </span>
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div style={styles.resultsSection}>
          {loading && (
            <div style={styles.loadingIndicator}>
              <div className="loading-spinner"></div>
              <span>Generating your personalized learning roadmap...</span>
            </div>
          )}
          
          {visibleSkills.length > 0 && !loading && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
                gap: '10px', 
                marginBottom: '20px' 
              }}>
                <h3 style={{ 
                  margin: '0',
                  fontSize: window.innerWidth <= 768 ? '18px' : '20px'
                }}>
                  Learning Roadmap for <span style={{ color: '#61dafb' }}>{jobTitle}</span>
                </h3>
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
              
              {/* Dynamic Roadmap Path with Live Generation Effect */}
              <div className="roadmap-container">
                <div className="roadmap-path"></div>
                {visibleSkills.filter(item => item && item.skill).map((item, idx) => {
                  // Additional safety checks for each item
                  const skill = item?.skill || 'Unknown Skill';
                  const level = item?.level || 'Beginner';
                  const course = item?.course || '#';
                  const importance = item?.importance || 'This skill is important for your career development.';
                  
                  return (
                    <div key={`${skill}-${idx}`} className="roadmap-node">
                      <div className="roadmap-step">{idx + 1}</div>
                      <div className="roadmap-card">
                        <div className={`level-badge level-${level.toLowerCase()}`}>
                          {level}
                        </div>
                        
                        <div className="roadmap-skill-title">
                          {skill}
                        </div>
                        
                        {/* Importance explanation with typewriter effect */}
                        <div style={styles.importanceText}>
                          {idx === typingIndex ? (
                            <>
                              {typedText}
                              <span style={styles.cursor}></span>
                            </>
                          ) : idx < typingIndex ? (
                            importance
                          ) : null}
                        </div>
                        
                        <a
                          href={course}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="learn-button"
                        >
                          📚 Start Learning
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {isDynamicGeneration && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: 'rgba(76, 175, 80, 0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  fontSize: window.innerWidth <= 768 ? '13px' : '14px',
                  color: '#4CAF50'
                }}>
                  🤖 This roadmap was dynamically generated using AI based on your job title. 
                  The courses are curated suggestions - verify links before starting.
                </div>
              )}
            </div>
          )}
          
          {!skills.length && jobTitle.length > 2 && !loading && recommendations.length === 0 && (
            <div style={{ 
              color: 'salmon', 
              marginTop: '16px',
              fontSize: window.innerWidth <= 768 ? '14px' : '16px',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Generating a custom learning path for "{jobTitle}"...
            </div>
          )}
          
          {/* LeetCode Interview Must-Do Section */}
          <div style={{ marginTop: '40px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '20px' : '24px',
                margin: '0',
                color: '#8B5CF6'
              }}>
                🧠 LeetCode Interview Must-Do Problems
              </h2>
              
              <div className="sort-controls">
                <label style={{ 
                  color: '#bbb', 
                  fontSize: '14px', 
                  marginRight: '10px' 
                }}>
                  Sort by:
                </label>
                <select 
                  value={leetcodeSortOrder}
                  onChange={(e) => setLeetcodeSortOrder(e.target.value)}
                  className="sort-select"
                >
                  <option value="easy-to-hard">Easy to Hard</option>
                  <option value="hard-to-easy">Hard to Easy</option>
                </select>
              </div>
            </div>
            
            <p style={{ 
              fontSize: isMobile ? '13px' : '14px', 
              color: '#bbb',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Master these handpicked LeetCode problems frequently asked in technical interviews
            </p>
            
            <div className="leetcode-grid">
              {getSortedLeetcodeProblems().map((problem) => (
                <div key={problem?.id || Math.random()} className="leetcode-problem-card">
                  <div className={`leetcode-difficulty leetcode-${(problem?.difficulty || 'easy').toLowerCase()}`}>
                    {problem?.difficulty || 'Easy'}
                  </div>
                  
                  <div className="leetcode-topic">
                    {problem?.topic || 'General'}
                  </div>
                  
                  <h3 className="leetcode-title">
                    {problem?.title || 'Practice Problem'}
                  </h3>
                  
                  <a 
                    href={problem?.link || '#'} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="leetcode-solve-button"
                  >
                    💻 Solve Problem
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="modal-overlay" onClick={() => setShowContactForm(false)}>
            <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Report an Issue</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowContactForm(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleContactSubmit} className="contact-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    required
                    placeholder="Your name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Issue Description</label>
                  <textarea
                    name="issue"
                    value={contactForm.issue}
                    onChange={handleContactChange}
                    required
                    placeholder="Please describe the issue you're experiencing..."
                    rows="4"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={contactStatus === 'sending'}
                >
                  {contactStatus === 'sending' ? 'Sending...' : 'Send Report'}
                </button>
                
                {contactStatus === 'success' && (
                  <div className="status-message success">
                    ✅ Thank you! Your report has been sent successfully.
                  </div>
                )}
                
                {contactStatus === 'error' && (
                  <div className="status-message error">
                    ❌ Failed to send report. Please try again.
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </header>
      
      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>AI-Powered Skill Mapper</h4>
            <p>Get personalized learning paths for your career goals</p>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <button 
              className="contact-link"
              onClick={() => setShowContactForm(true)}
            >
              📧 Report an Issue
            </button>
          </div>
          
          <div className="footer-section">
            <h4>Resources</h4>
            <div className="footer-links">
              <a href="#leetcode" onClick={(e) => {
                e.preventDefault();
                document.querySelector('.leetcode-grid').scrollIntoView({ behavior: 'smooth' });
              }}>
                LeetCode Problems
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Connect</h4>
            <div className="footer-links">
              <a 
                href="https://www.linkedin.com/in/naveenkumar-kalluri-3b7709224/" 
                target="_blank"
                rel="noopener noreferrer"
                className="linkedin-link"
              >
                💼 LinkedIn Profile
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 Naveenkumar Kalluri. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
