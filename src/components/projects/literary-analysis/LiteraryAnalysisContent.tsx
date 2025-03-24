'use client';

import { useEffect, useRef, useState } from 'react';

// Function to track statistics
async function trackStats(action: string, data: any) {
    try {
        await fetch('/api/statistics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, data }),
        });
    } catch (error) {
        console.error('Error tracking statistics:', error);
    }
}

const LiteraryAnalysisContent = () => {
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const sectionViewsTracked = useRef<Set<string>>(new Set());
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // New tracking effect
    useEffect(() => {
        // Track that the literary analysis was viewed
        trackStats('project_accessed', { projectName: 'Literary Analysis' });
        
        // Start tracking time spent
        const startTime = new Date();
        
        return () => {
            // Track time spent when component unmounts
            const endTime = new Date();
            const minutesSpent = (endTime.getTime() - startTime.getTime()) / 1000 / 60;
            
            trackStats('time_spent', { 
                minutes: minutesSpent,
                projectName: 'Literary Analysis'
            });
        };
    }, []);

    // Track active section changes
    useEffect(() => {
        if (activeSection && !sectionViewsTracked.current.has(activeSection)) {
            // Add to tracked sections set
            sectionViewsTracked.current.add(activeSection);
        }
    }, [activeSection]);

    useEffect(() => {
        // Create the script element if it doesn't exist
        if (!scriptRef.current) {
            const script = document.createElement('script');
            
            // Wrap all script code in an IIFE to avoid variable collisions
            script.innerHTML = `
            (function() {
                // Accordion functionality
                const accordionTitles = document.querySelectorAll('.accordion-title');
                
                accordionTitles.forEach(title => {
                    title.addEventListener('click', () => {
                        const content = title.nextElementSibling;
                        const titleText = title.textContent || 'Accordion section';
                        
                        // Track when an accordion is opened
                        fetch('/api/statistics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'section_interaction',
                                data: { 
                                    type: 'accordion',
                                    title: titleText,
                                    action: 'toggle'
                                }
                            })
                        }).catch(console.error);
                        
                        title.classList.toggle('active');
                        
                        if (content.classList.contains('active')) {
                            content.classList.remove('active');
                        } else {
                            content.classList.add('active');
                        }
                    });
                });
                
                // Tab functionality
                const tabLinks = document.querySelectorAll('.tab-nav li');
                
                tabLinks.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const tabId = tab.getAttribute('data-tab');
                        const tabText = tab.textContent || 'Tab section';
                        
                        // Track when a tab is clicked
                        fetch('/api/statistics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'section_interaction',
                                data: { 
                                    type: 'tab',
                                    title: tabText,
                                    action: 'selected'
                                }
                            })
                        }).catch(console.error);
                        
                        // Remove active class from all tabs and contents
                        document.querySelectorAll('.tab-nav li').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                        
                        // Add active class to clicked tab and corresponding content
                        tab.classList.add('active');
                        document.getElementById(tabId)?.classList.add('active');
                    });
                });
                
                // Smooth scrolling for anchor links
                document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                    anchor.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        const target = document.querySelector(this.getAttribute('href'));
                        const sectionId = this.getAttribute('href')?.substring(1);
                        const sectionTitle = target?.querySelector('h2, h3')?.textContent || sectionId || 'Section';
                        
                        // Track when a section link is clicked
                        fetch('/api/statistics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'section_viewed',
                                data: { 
                                    sectionId: sectionId,
                                    title: sectionTitle
                                }
                            })
                        }).catch(console.error);
                        
                        if (target) {
                            window.scrollTo({
                                top: target.offsetTop - 20,
                                behavior: 'smooth'
                            });
                        }
                    });
                });
                
                // Back to top button functionality
                const backToTopButton = document.querySelector('.back-to-top');
                if (backToTopButton) {
                    backToTopButton.addEventListener('click', () => {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    });
                }
                
                // Highlight current section in table of contents
                const sections = document.querySelectorAll('section[id]');
                const navLinks = document.querySelectorAll('nav.toc a[href^="#"]');
                
                // Improved function to highlight current section and auto-scroll the TOC
                function highlightCurrentSection() {
                    const scrollPosition = window.scrollY;
                    
                    // Find all visible sections and subsections
                    const allHeadings = document.querySelectorAll('section[id], h3[id]');
                    let currentHeadingId = '';
                    
                    // Find the current section or subsection
                    for (let i = 0; i < allHeadings.length; i++) {
                        const heading = allHeadings[i];
                        const nextHeading = allHeadings[i + 1];
                        
                        const headingTop = heading.offsetTop - 100;
                        const headingBottom = nextHeading ? nextHeading.offsetTop - 100 : document.body.scrollHeight;
                        
                        if (scrollPosition >= headingTop && scrollPosition < headingBottom) {
                            currentHeadingId = '#' + heading.getAttribute('id');
                            
                            // Get the heading text
                            const headingText = heading.querySelector('h2, h3')?.textContent || heading.getAttribute('id') || 'Unknown section';
                            
                            // Track section view through window variable to be accessed by React
                            if (window.trackCurrentSection && currentHeadingId) {
                                window.trackCurrentSection(currentHeadingId.substring(1), headingText);
                            }
                            
                            break;
                        }
                    }
                    
                    // Clear all current highlights
                    navLinks.forEach(link => {
                        link.classList.remove('current');
                    });
                    
                    // If no current heading was found, exit
                    if (!currentHeadingId) return;
                    
                    // Find and highlight the current link
                    const currentLink = document.querySelector('nav.toc a[href="' + currentHeadingId + '"]');
                    if (currentLink) {
                        currentLink.classList.add('current');
                        
                        // Highlight parent links if this is a subsection
                        let parent = currentLink.closest('li')?.parentElement;
                        while (parent && parent.tagName === 'UL') {
                            const parentLi = parent.closest('li');
                            if (!parentLi) break;
                            
                            const parentLink = parentLi.querySelector('a');
                            if (parentLink) {
                                parentLink.classList.add('current');
                            }
                            
                            parent = parentLi.parentElement;
                        }
                        
                        // Auto-scroll the TOC to keep the highlighted item visible
                        const tocContainer = document.querySelector('nav.toc');
                        if (tocContainer && currentLink) {
                            const linkRect = currentLink.getBoundingClientRect();
                            const containerRect = tocContainer.getBoundingClientRect();
                            
                            // Check if the current link is outside the visible area of the TOC
                            if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
                                // Scroll the current item into view with smooth behavior
                                currentLink.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest'
                                });
                            }
                        }
                    }
                }
                
                // Expose function to track current section to window
                window.trackCurrentSection = function(sectionId, sectionTitle) {
                    if (window.lastTrackedSection !== sectionId) {
                        window.lastTrackedSection = sectionId;
                        
                        // Track via fetch request
                        fetch('/api/statistics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'section_viewed',
                                data: { 
                                    sectionId: sectionId,
                                    title: sectionTitle
                                }
                            })
                        }).catch(console.error);
                    }
                };
                
                // Initialize tracking variables
                window.lastTrackedSection = '';
                
                // Call once on load and then on scroll
                highlightCurrentSection();
                window.addEventListener('scroll', highlightCurrentSection);
            })();
            `;
            
            scriptRef.current = script;
            document.body.appendChild(script);
            
            // Add global type definition for window
            window.trackCurrentSection = (sectionId: string, sectionTitle: string) => {
                // This function will be overridden by the script above,
                // but we define it here to avoid TypeScript errors
                setActiveSection(sectionId);
            };
            window.lastTrackedSection = '';
        }

        // Cleanup function
        return () => {
            if (scriptRef.current) {
                document.body.removeChild(scriptRef.current);
                scriptRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures effect runs only once

    return (
        <div 
            className="literary-analysis-container" 
            dangerouslySetInnerHTML={{ __html: literaryAnalysisHTML }} 
        />
    );
};

// The HTML content as a string constant
const literaryAnalysisHTML = `
<!-- Start of HTML content -->
<style>
:root {
    --primary-color: #2e4053;
    --primary-light: #4a5f75;
    --primary-dark: #1a2a3a;
    --secondary-color: #c0392b;
    --secondary-light: #e74c3c;
    --secondary-dark: #962b21;
    --accent-color: #f39c12;
    --text-color: #333;
    --text-light: #777;
    --bg-color: #f9f9f5;
    --card-color: #fff;
    --border-color: #ddd;
    --highlight-bg: #ebf5fb;
    --quote-bg: #f8f9fa;
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.1);
    --transition: all 0.3s ease;
}

.literary-analysis-container * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.literary-analysis-container {
    font-family: 'Georgia', serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--bg-color);
    padding-bottom: 2rem;
}

.literary-analysis-container header {
    background-color: var(--primary-color);
    color: white;
    padding: 2rem 0;
    text-align: center;
    position: relative;
    margin-bottom: 2rem;
    background-image: linear-gradient(to right, var(--primary-dark), var(--primary-color), var(--primary-light));
}

.literary-analysis-container header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
}

.literary-analysis-container header h2 {
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1rem;
    opacity: 0.9;
}

.literary-analysis-container header .author {
    font-style: italic;
    font-size: 1.2rem;
    opacity: 0.8;
}

.literary-analysis-container .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
}

.literary-analysis-container nav.toc {
    flex: 0 0 280px;
    position: sticky;
    top: 2rem;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    background-color: var(--card-color);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    transition: var(--transition);
    padding-left: 0;
}

.literary-analysis-container nav.toc:hover {
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.literary-analysis-container nav.toc h3 {
    background-color: var(--primary-color);
    color: white;
    padding: 1rem;
    border-radius: 8px 8px 0 0;
    font-size: 1.2rem;
    text-align: center;
}

.literary-analysis-container nav.toc ul {
    list-style: none;
    padding: 0.5rem;
}

.literary-analysis-container nav.toc ul li {
    margin-bottom: 0.8rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.8rem;
}

.literary-analysis-container nav.toc ul li:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.literary-analysis-container nav.toc a {
    text-decoration: none;
    color: var(--text-color);
    display: block;
    transition: var(--transition);
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
}

.literary-analysis-container nav.toc a:hover {
    color: var(--secondary-color);
    background-color: var(--highlight-bg);
    transform: translateX(5px);
}

.literary-analysis-container nav.toc a.active {
    color: var(--secondary-color);
    font-weight: bold;
}

.literary-analysis-container nav.toc ul li ul {
    padding: 0.5rem 0 0 1rem;
}

.literary-analysis-container nav.toc ul li ul li {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    font-size: 0.95rem;
}

.literary-analysis-container main {
    flex: 1;
    min-width: 0;
    background-color: var(--card-color);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    padding: 2rem;
    transition: var(--transition);
}

.literary-analysis-container section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-color);
}

.literary-analysis-container section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.literary-analysis-container h2 {
    color: var(--primary-color);
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--secondary-color);
    position: relative;
}

.literary-analysis-container h2::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 80px;
    height: 2px;
    background-color: var(--accent-color);
}

.literary-analysis-container h3 {
    color: var(--primary-color);
    margin: 1.8rem 0 1rem;
    font-size: 1.5rem;
}

.literary-analysis-container h4 {
    margin: 1.5rem 0 0.8rem;
    color: var(--secondary-color);
    font-size: 1.2rem;
}

.literary-analysis-container p {
    margin-bottom: 1rem;
    text-align: justify;
}

.literary-analysis-container blockquote {
    margin: 1.5rem 0;
    padding: 1.5rem;
    background-color: var(--quote-bg);
    border-left: 5px solid var(--secondary-color);
    font-style: italic;
    position: relative;
}

.literary-analysis-container blockquote::before {
    content: '»';
    position: absolute;
    top: 0;
    left: 10px;
    font-size: 3rem;
    color: rgba(0,0,0,0.1);
}

.literary-analysis-container blockquote::after {
    content: '«';
    position: absolute;
    bottom: 0;
    right: 10px;
    font-size: 3rem;
    color: rgba(0,0,0,0.1);
}

.literary-analysis-container .character-card {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
}

.literary-analysis-container .character-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-3px);
}

.literary-analysis-container .character-card h3 {
    color: var(--secondary-color);
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
}

.literary-analysis-container .character-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background-color: var(--accent-color);
}

.literary-analysis-container .quote {
    font-style: italic;
    color: var(--primary-color);
    position: relative;
    padding-left: 20px;
}

.literary-analysis-container .quote::before {
    content: '»';
    position: absolute;
    left: 0;
    top: 0;
    color: var(--secondary-color);
    font-size: 1.5rem;
}

.literary-analysis-container .quote::after {
    content: '«';
    position: absolute;
    right: 0;
    bottom: 0;
    color: var(--secondary-color);
    font-size: 1.5rem;
}

.literary-analysis-container .highlight {
    background-color: rgba(52, 152, 219, 0.1);
    padding: 0 3px;
    font-weight: bold;
}

.literary-analysis-container .tag {
    display: inline-block;
    background-color: var(--highlight-bg);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid var(--border-color);
    color: var(--primary-color);
}

.literary-analysis-container .info-box {
    background-color: var(--highlight-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    position: relative;
}

.literary-analysis-container .info-box h4 {
    color: var(--primary-color);
    margin-top: 0;
    margin-bottom: 0.5rem;
}

.literary-analysis-container .flex-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin: 2rem 0;
}

.literary-analysis-container .flex-item {
    flex: 1;
    min-width: 300px;
}

.literary-analysis-container .flex-item img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
}

/* Table styles */
.literary-analysis-container table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    box-shadow: var(--shadow-sm);
}

.literary-analysis-container table thead {
    background-color: var(--primary-color);
    color: white;
}

.literary-analysis-container table th,
.literary-analysis-container table td {
    padding: 0.8rem;
    text-align: left;
    border: 1px solid var(--border-color);
}

.literary-analysis-container table tbody tr:nth-child(even) {
    background-color: var(--highlight-bg);
}

/* Tabs */
.literary-analysis-container .tabs {
    margin: 2rem 0;
}

.literary-analysis-container .tab-nav {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    border-bottom: 2px solid var(--border-color);
}

.literary-analysis-container .tab-nav li {
    padding: 0.8rem 1.5rem;
    cursor: pointer;
    margin-bottom: -2px;
    transition: var(--transition);
}

.literary-analysis-container .tab-nav li.active {
    background-color: var(--card-color);
    border: 2px solid var(--border-color);
    border-bottom: 2px solid var(--card-color);
    color: var(--secondary-color);
    font-weight: bold;
}

.literary-analysis-container .tab-content {
    padding: 1.5rem;
    border: 2px solid var(--border-color);
    border-top: none;
    display: none;
}

.literary-analysis-container .tab-content.active {
    display: block;
}

/* Timeline */
.literary-analysis-container .timeline {
    position: relative;
    max-width: 1200px;
    margin: 2rem auto;
}

.literary-analysis-container .timeline::after {
    content: '';
    position: absolute;
    width: 6px;
    background-color: var(--border-color);
    top: 0;
    bottom: 0;
    left: 50%;
    margin-left: -3px;
}

.literary-analysis-container .timeline-item {
    padding: 10px 40px;
    position: relative;
    width: 50%;
    box-sizing: border-box;
}

.literary-analysis-container .timeline-item::after {
    content: '';
    position: absolute;
    width: 25px;
    height: 25px;
    right: -17px;
    background-color: var(--accent-color);
    border: 4px solid var(--primary-color);
    top: 15px;
    border-radius: 50%;
    z-index: 1;
}

.literary-analysis-container .timeline-left {
    left: 0;
}

.literary-analysis-container .timeline-right {
    left: 50%;
}

.literary-analysis-container .timeline-right::after {
    left: -16px;
}

.literary-analysis-container .timeline-content {
    padding: 20px 30px;
    background-color: var(--card-color);
    position: relative;
    border-radius: 6px;
    box-shadow: var(--shadow-sm);
}

.literary-analysis-container .timeline-content h3 {
    margin-top: 0;
    color: var(--primary-color);
}

/* Accordion */
.literary-analysis-container .accordion {
    margin: 2rem 0;
}

.literary-analysis-container .accordion-item {
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
}

.literary-analysis-container .accordion-title {
    padding: 1rem;
    background-color: var(--highlight-bg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    transition: var(--transition);
}

.literary-analysis-container .accordion-title:hover {
    background-color: var(--primary-light);
    color: white;
}

.literary-analysis-container .accordion-title.active {
    background-color: var(--primary-color);
    color: white;
}

.literary-analysis-container .accordion-title::after {
    content: '+';
    font-size: 1.5rem;
}

.literary-analysis-container .accordion-title.active::after {
    content: '-';
}

.literary-analysis-container .accordion-content {
    padding: 0 1rem;
    max-height: 0;
    overflow: hidden;
    transition: var(--transition);
}

.literary-analysis-container .accordion-content.active {
    padding: 1rem;
    max-height: 1000px;
}

/* Figure constellation diagram */
.literary-analysis-container .figure-diagram {
    width: 100%;
    max-width: 800px;
    margin: 2rem auto;
    padding: 1.5rem;
    background-color: var(--card-color);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
}

.literary-analysis-container .figure-diagram svg {
    width: 100%;
    height: auto;
}

/* Symbol explanations */
.literary-analysis-container .symbols-list {
    list-style: none;
}

.literary-analysis-container .symbols-list li {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
    position: relative;
}

.literary-analysis-container .symbols-list li::before {
    content: '⟫';
    position: absolute;
    left: 0;
    color: var(--secondary-color);
    font-weight: bold;
}

/* Footer */
.literary-analysis-container footer {
    text-align: center;
    margin-top: 3rem;
    padding: 2rem;
    background-color: var(--primary-color);
    color: white;
}

.literary-analysis-container footer p {
    max-width: 800px;
    margin: 0 auto 1rem;
    text-align: center;
}

.literary-analysis-container footer a {
    color: var(--accent-color);
    text-decoration: none;
}

.literary-analysis-container footer a:hover {
    text-decoration: underline;
}

/* Back to top button - change position to right-bottom */
.literary-analysis-container .back-to-top {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background-color: rgba(46, 64, 83, 0.3);
    color: white;
    border: none;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 100;
    opacity: 0.3;
}

.literary-analysis-container .back-to-top:hover {
    opacity: 1;
    background-color: rgba(46, 64, 83, 0.9);
}

.literary-analysis-container .back-to-top::before {
    content: '↑';
    font-size: 20px;
    font-weight: bold;
}

/* Add a subtle background color for parent items that are current */
.literary-analysis-container nav.toc li ul li a.current {
    background-color: rgba(235, 245, 251, 0.7);
}

/* Add styles for active section in TOC */
.literary-analysis-container nav.toc a.current {
    background-color: var(--highlight-bg);
    color: var(--secondary-color);
    border-left: 3px solid var(--secondary-color);
    padding-left: calc(0.5rem - 3px);
    box-shadow: 0 0 3px rgba(192, 57, 43, 0.3);
}

/* Responsive styles */
@media (max-width: 1200px) {
    .literary-analysis-container .container {
        flex-direction: column;
    }
    
    .literary-analysis-container nav.toc {
        position: static;
        width: 100%;
        flex: 0 0 100%;
        margin-bottom: 2rem;
        max-height: none;
    }
    
    .literary-analysis-container .figure-diagram {
        padding: 1rem;
    }
    
    .literary-analysis-container .timeline::after {
        left: 31px;
    }
    
    .literary-analysis-container .timeline-item {
        width: 100%;
        padding-left: 70px;
        padding-right: 25px;
    }
    
    .literary-analysis-container .timeline-item::after {
        left: 15px;
    }
    
    .literary-analysis-container .timeline-right {
        left: 0;
    }
}

@media (max-width: 768px) {
    .literary-analysis-container header h1 {
        font-size: 2rem;
    }
    
    .literary-analysis-container header h2 {
        font-size: 1.2rem;
    }
    
    .literary-analysis-container .container {
        padding: 0 1rem;
    }
    
    .literary-analysis-container main {
        padding: 1.5rem;
    }
    
    .literary-analysis-container h2 {
        font-size: 1.8rem;
    }
    
    .literary-analysis-container h3 {
        font-size: 1.3rem;
    }
    
    .literary-analysis-container .character-card {
        padding: 1rem;
    }
    
    .literary-analysis-container .flex-container {
        flex-direction: column;
    }
    
    .literary-analysis-container .tab-nav li {
        padding: 0.5rem 1rem;
    }
}
</style>

<header>
    <h1>Heinrich von Kleists "Der zerbrochne Krug"</h1>
    <h2>Nandor Koch || 2025</h2>
    <div class="author">Analyse und Interpretation für die Oberstufe</div>
</header>

<div class="container">
    <nav class="toc">
        <h3>Inhaltsverzeichnis</h3>
        <ul>
            <li><a href="#einleitung">Autor und Werk</a></li>
            <li>
                <a href="#inhaltsanalyse">Inhaltserläuterung</a>
                <ul>
                    <li><a href="#ueberblick">Überblick und Struktur</a></li>
                    <li><a href="#exposition">1. Exposition (1.-5. Auftritt)</a></li>
                    <li><a href="#steigende-handlung">2. Steigende Handlung (6.-9. Auftritt)</a></li>
                    <li><a href="#hoehepunkt">3. Höhepunkt (9. Auftritt)</a></li>
                    <li><a href="#fallende-handlung">4. Fallende Handlung (10.-11. Auftritt)</a></li>
                    <li><a href="#loesung">5. Lösung (12.-13. Auftritt)</a></li>
                </ul>
            </li>
            <li>
                <a href="#figuren">Figuren</a>
                <ul>
                    <li><a href="#figuren-konstellation">Figurenkonstellation</a></li>
                    <li><a href="#adam">Dorfrichter Adam</a></li>
                    <li><a href="#licht">Gerichtsschreiber Licht</a></li>
                    <li><a href="#walter">Gerichtsrat Walter</a></li>
                    <li><a href="#marthe">Frau Marthe</a></li>
                    <li><a href="#eve">Eve</a></li>
                    <li><a href="#ruprecht">Ruprecht</a></li>
                    <li><a href="#nebenfiguren">Nebenfiguren</a></li>
                </ul>
            </li>
            <li>
                <a href="#auftritt-analyse">Detaillierte Auftrittanalyse</a>
            </li>
            <li>
                <a href="#sprache-form">Sprache und Form</a>
                <ul>
                    <li><a href="#sprache">Sprache und Stil</a></li>
                    <li><a href="#versform">Versform und Metrik</a></li>
                    <li><a href="#aufbau">Dramenaufbau</a></li>
                </ul>
            </li>
            <li>
                <a href="#symbolik">Symbolik und Deutung</a>
                <ul>
                    <li><a href="#symbole">Wichtige Symbole</a></li>
                    <li><a href="#biblische-anspielungen">Biblische Anspielungen</a></li>
                </ul>
            </li>
            <li>
                <a href="#interpretation">Interpretation</a>
                <ul>
                    <li><a href="#thematik">Zentrale Themen</a></li>
                    <li><a href="#epoche">Einordnung in die Epoche</a></li>
                    <li><a href="#rezeption">Rezeption und Wirkung</a></li>
                </ul>
            </li>
        </ul>
    </nav>
    
    <main>
        <section id="einleitung">
            <h2>Autor und Werk</h2>
            
            <div class="flex-container">
                <div class="flex-item">
                    <h3>Heinrich von Kleist (1777-1811)</h3>
                    <p>Heinrich von Kleist, eigentlich Bernd Heinrich Wilhelm von Kleist, wurde am 18. Oktober 1777 in Frankfurt an der Oder als Sohn einer angesehenen preußischen Uradelsfamilie geboren. Nach der Schule absolvierte Kleist zunächst die damals übliche Militärlaufbahn. 1797 wurde er zum Leutnant befördert, doch brach er zwei Jahre später aus Überzeugung und zum Missfallen seiner Familie seine Karriere ab, um sich der geistigen Weiterbildung zu widmen.</p>
                    
                    <p>Nach kurzer Zeit brach er jedoch auch sein Studium ab und wurde Staatsbeamter. Er wechselte oft seinen Wohnort, unternahm viele Reisen durch Mitteleuropa und verkehrte währenddessen in Schriftstellerkreisen. Auch er selbst gab sich letztendlich der Literatur hin, wurde dafür Zeit seines Lebens allerdings nie ausreichend gewürdigt.</p>
                    
                    <p>Sein Leben war geprägt von Mittellosigkeit und er war getrieben von seiner inneren Zerrissenheit und Orientierungslosigkeit. Aus diesen Gründen beging er im Jahr 1811 Doppelsuizid mit seiner engen, kranken Freundin Henriette Vogel.</p>
                    
                    <p>Gegenwärtig zählt Kleists Schaffen zu den bedeutsamsten Werken im Kanon deutschsprachiger Literatur. Er genießt große Popularität, Straßen und Schulen wurden nach ihm benannt. Ihm zu Ehren wurde sogar der sogenannte Kleist-Preis 1912 ins Leben gerufen, der zwanzig Jahre währte und seit der Wiederaufnahme 1985 bis heute zu den wichtigsten deutschen Literaturpreisen zählt.</p>
                </div>
                
                <div class="flex-item">
                    <h3>Das Werk "Der zerbrochne Krug"</h3>
                    <p>Auf seiner Reise in die Schweiz 1802 inspirierte Kleist ein Kupferstich eines Dorfgerichts dazu, "Der zerbrochne Krug" zu verfassen. Das Drama handelt von einem Gerichtsprozess, den der Richter Adam leitet. Frau Marthe klagt den Verlobten ihrer Tochter Eve an, am vorherigen Abend ihren Krug zerbrochen zu haben.</p>
                    
                    <p>Das 1808 veröffentlichte Lustspiel wurde im selben Jahr durch die Theaterleitung von Johann Wolfgang Goethe im Hoftheater zu Weimar uraufgeführt, stieß allerdings nicht auf Begeisterung und zog lange währende Kritik auf sich. Das änderte sich erst Anfang des 20. Jahrhunderts. Heute ist es eines der meist inszenierten Werke auf deutschen Bühnen.</p>
                    
                    <div class="info-box">
                        <h4>Werkdaten im Überblick:</h4>
                        <ul>
                            <li><strong>Gattung:</strong> Lustspiel</li>
                            <li><strong>Erscheinungsjahr:</strong> 1811</li>
                            <li><strong>Uraufführung:</strong> 1808 im Hoftheater in Weimar</li>
                            <li><strong>Handlungsort:</strong> Gerichtsstube von Huisum</li>
                            <li><strong>Handlungszeit:</strong> Ende des 17. Jahrhunderts</li>
                            <li><strong>Aufbau:</strong> 13 Auftritte (entsprechend dem klassischen 5-Akt-Schema)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        
        <section id="inhaltsanalyse">
            <h2>Inhaltserläuterung</h2>
            
            <h3 id="ueberblick">Überblick und Struktur</h3>
            <p>Das von Kleist im Jahr 1808 veröffentlichte Drama "Der zerbrochne Krug" handelt von Machtmissbrauch, Unfähigkeiten bzw. Ungerechtigkeiten in der Justiz, Schuldfragen und der Bewahrung von unbefleckter Ehre. Ein zerbrochener Krug gibt Anlass zu einer Gerichtsverhandlung. Im Mittelpunkt steht das Handeln des Richters Adam, der sich schon ab Beginn des Dramas verdächtig aufführt und in den Fall verstrickt zu sein scheint.</p>
            
            <p>Das Stück gliedert sich in insgesamt 13 unterschiedlich lange Auftritte und lässt sich getreu eines klassischen Dramas in fünf Akte aufteilen:</p>
            
            <div class="figure-diagram">
                <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                    <!-- Drama Structure Pyramid -->
                    <polygon points="400,50 700,350 100,350" fill="#e8f4f8" stroke="#2e4053" stroke-width="2" stroke-opacity="0.5"/>
                    
                    <!-- Background boxes for text (to improve readability) -->
                    <rect x="325" y="10" width="150" height="30" rx="4" fill="white" fill-opacity="0.8"/>
                    <rect x="300" y="80" width="200" height="30" rx="4" fill="white" fill-opacity="0.8"/>
                    
                    <rect x="125" y="280" width="150" height="30" rx="4" fill="white" fill-opacity="0.8"/>
                    <rect x="100" y="315" width="200" height="45" rx="4" fill="white" fill-opacity="0.8"/>
                    
                    <rect x="525" y="280" width="150" height="30" rx="4" fill="white" fill-opacity="0.8"/>
                    <rect x="500" y="315" width="200" height="45" rx="4" fill="white" fill-opacity="0.8"/>
                    
                    <rect x="175" y="130" width="150" height="30" rx="4" fill="white" fill-opacity="0.8"/>
                    <rect x="150" y="165" width="200" height="45" rx="4" fill="white" fill-opacity="0.8"/>
                    
                    <rect x="475" y="130" width="150" height="30" rx="4" fill="white" fill-opacity="0.8"/>
                    <rect x="450" y="165" width="200" height="45" rx="4" fill="white" fill-opacity="0.8"/>
                    
                    <!-- Labels -->
                    <text x="400" y="30" text-anchor="middle" font-weight="bold" font-size="16">Höhepunkt</text>
                    <text x="400" y="100" text-anchor="middle" font-size="14">Entlassung Ruprechts durch Eves Aussage</text>
                    
                    <text x="250" y="150" text-anchor="middle" font-weight="bold" font-size="16">Steigende Handlung</text>
                    <text x="250" y="180" text-anchor="middle" font-size="14">Widersprüchliche Aussagen</text>
                    <text x="250" y="200" text-anchor="middle" font-size="14">Parteiischer Richter</text>
                    
                    <text x="550" y="150" text-anchor="middle" font-weight="bold" font-size="16">Fallende Handlung</text>
                    <text x="550" y="180" text-anchor="middle" font-size="14">Retardierende Momente:</text>
                    <text x="550" y="200" text-anchor="middle" font-size="14">Verhandlungspause & Brigittes Aussage</text>
                    
                    <text x="150" y="300" text-anchor="middle" font-weight="bold" font-size="16">Exposition</text>
                    <text x="150" y="330" text-anchor="middle" font-size="14">Vorstellung der Figuren</text>
                    <text x="150" y="350" text-anchor="middle" font-size="14">und Hauptkonflikte</text>
                    
                    <text x="650" y="300" text-anchor="middle" font-weight="bold" font-size="16">Lösung</text>
                    <text x="650" y="330" text-anchor="middle" font-size="14">Adams Überführung und Flucht</text>
                    <text x="650" y="350" text-anchor="middle" font-size="14">Versöhnung der Liebenden</text>
                </svg>
            </div>
            
            <h3 id="exposition">1. Einführung: Vorstellung der Hauptfiguren und Situationen (1.- 5. Auftritt) <span class="tag">Exposition</span></h3>
            
            <p>Die Handlung beginnt mit einem Aufeinandertreffen des Richters Adam und seinem Protokollführer Licht. Licht wundert sich über Adams Klumpfuß und sein übel zugerichtetes Gesicht, dessen Entstehung Adam erst durch Nachfragen mit einem morgigen Sturz missgestimmt aufklärt. Dann informiert Licht den Richter über den unangekündigten Besuch des Gerichtsrats Walter, woraufhin Adam panisch reagiert.</p>
            
            <p>Im Nachbardorf habe sich nach dem Besuch des Gerichtsrat ein Kollege Adams erhängt. Er spielt mit dem Gedanken, sich krank zu melden. Doch stattdessen redet er auf Licht ein, er solle ihm heute beistehen, auch wenn Licht selbst gerne Richter werden würde. Den Mägden befiehlt er für den Gerichtstag und den Besuch alles vorzubereiten.</p>
            
            <p>Adams Perücke ist jedoch nicht auffindbar, was Licht zu Skepsis veranlasst. Er stellt erneute Nachfragen zu dem malträtierten Zustand des Richters und dem Verschwinden der Perücke, in die, Adam zufolge, in der gestrigen Nacht scheinbar eine Katze gejungt hatte und demnach zunächst gereinigt werden müsse.</p>
            
            <p>Im dritten Auftritt erzählt Adam Licht von seinem Albtraum, in dem er selbst vor Gericht zu einer Gefängnisstrafe verurteilt wurde. Kurz darauf tritt der Gerichtsrat Walter ein. Adam versucht zunächst, ihm zu schmeicheln, doch gibt er sich schnell verlegen, als Walter verkündet, die Kassen kontrollieren und am Gerichtsprozess teilhaben zu wollen.</p>
            
            <p>Eine Magd kehrt zurück, um Adam zu unterrichten, dass ihr Versuch, sich die Perücke des Küsters zu leihen, erfolglos war. So erfährt Walter von dem Debakel um die Perücke und veranlasst verärgert die Magd dazu, vom Pächter eines weit entfernt gelegenen Vorwerks schnellstens eine Perücke zu organisieren.</p>
            
            <h3 id="steigende-handlung">2. Der Prozessbeginn (6. – 9. Auftritt) <span class="tag">Steigende Handlung</span></h3>
            
            <p>Der sechste Auftritt beginnt mit einer Streitsituation. Es erscheinen die Klägerin Frau Marthe und ihre Tochter Eve sowie der Angeklagte, Eves Verlobter Ruprecht und dessen Vater Veit. Während Marthe Ruprecht beschuldigt, er habe ihren Krug zerbrochen, hält er ihr vor, sie mache diese falsche Anschuldigung aus der Empörung heraus über seine Auflösung der Verlobung mit ihrer Tochter.</p>
            
            <p>Denn Ruprecht wirft Eve vor, eine Metze zu sein, was eine abfällige Bezeichnung für eine Prostituierte ist. Eve und Veit hingegen versuchen versöhnlich, die beiden Streitparteien zu besänftigen. Die Situation scheint den Richter Adam zu verunsichern, er überlegt zunächst erneut wegen seines körperlichen Zustandes ins Bett zu gehen.</p>
            
            <p>Dann redet er heimlich auf Eve ein und versucht, ihr Druck zu machen, sich vor Gericht klug zu verhalten. Umgehend weist der Gerichtsrat Walter den Richter jedoch zurecht, woraufhin er das Zwiegespräch als eine neutrale Unterhaltung über sein krankes Perlhuhn darstellt.</p>
            
            <p>Der Prozess beginnt und Frau Marthe soll Adam ihre Klage vorzeigen. Er bittet sie jedoch zunächst darum, sich vorzustellen, obwohl die beiden einander vertraut sind. Des Weiteren bemüht er sich, den Prozess vorschnell, aber unprofessionell abzuschließen. Sein Handeln sorgt für Verwirrung und Ärger bei den anderen Anwesenden. Erneut weist Walter den Richter zurecht.</p>
            
            <p>Im Anschluss präsentiert Frau Marthe die Wichtigkeit und die Unersetzbarkeit ihres zerbrochenen Kruges und offenbart ihren dadurch ausgelösten Zorn. Sie referiert zu ihrer Tochter als Zeugin, die ihre Aussage, Ruprecht als Täter zu bezichtigen, zurückzieht. Während des Streitgesprächs der Beteiligten verhält sich Adam zunehmend verdächtig, in den Fall verwickelt zu sein. Licht und Walter äußern hin und wieder Anspielungen zu diesem Verdacht.</p>
            
            <p>Dann macht Ruprecht seine Aussage. Er plante, am vorherigen Abend Eve zu besuchen, beobachtete aber bei seiner Ankunft in ihrem Garten einen anderen Mann in Eves Zimmer. Er kann ihn nicht identifizieren, vermutet jedoch, dass es sich bei ihm um den Flickschuster Lebrecht handelt. Schließlich hätte dieser schon in der Vergangenheit Interesse an Eve gezeigt.</p>
            
            <h3 id="hoehepunkt">3. Höhepunkt (9. Auftritt) <span class="tag">Höhepunkt</span></h3>
            
            <p>Nach kurzer Weile trat Ruprecht Eves Zimmertür ein, im selben Moment sprang der unbekannte Mann aus dem Fenster und zerbrach dabei den Krug. Mit der Türklinke schlägt Ruprecht auf den Unbekannten ein, der noch in den Weinranken des Hauses hängt. Dieser wirft Ruprecht jedoch Sand in die Augen, so dass ihm unentdeckt die Flucht gelingt.</p>
            
            <p>Frau Marthe bittet ihre Tochter daraufhin um Aufklärung. Dies versetzt Adam in Unruhe, er versucht, ihre Zeugenaussage zu verhindern, verurteilt Lebrecht voreilig und redet auf Eve ein. Walter unterbindet seine Anstrengungen. So gesteht Eve ihre gestrige Lüge und behauptet nun, Ruprecht habe den Krug nicht zerbrochen. Wer allerdings der tatsächliche Täter war, möchte sie in dieser Situation nicht offenbaren. Stattdessen beginnt sie, ein anderes Verbrechen anzusprechen, wird allerdings unterbrochen. Frau Marthe ist von Ruprechts Schuld überzeugt und fordert ein, eine gewisse Brigitte in den Zeugenstand rufen zu lassen, um dies zu bestätigen.</p>
            
            <h3 id="fallende-handlung">4. Neuer Impuls durch externe Zeugin (10. – 11. Auftritt) <span class="tag">Fallende Handlung</span></h3>
            
            <p>Bis Brigitte eintritt, folgt eine kurze Pause des Prozesses. Adam umsorgt Walter währenddessen mit ausreichend Wein und Käse. Walter befragt Adam zu seiner fehlenden Perücke und seinen Wunden. Ebenso erkundigt er sich bei Frau Marthe über die Regelmäßigkeit von Adams Besuchen bei ihr zuhause, die sich als nur sehr selten herausstellen. Währenddessen schenkt sich Adam selbst andauernd Wein nach und versucht, auch Walter zum Mittrinken zu bewegen.</p>
            
            <p>Dann taucht die Zeugin Brigitte auf und hält eine weiße Perücke in der Hand, die sie im Garten von Frau Marthe gefunden hatte. Es handelt sich um die Perücke von Adam, der nun behauptet, diese Ruprecht gegeben zu haben. Doch Brigitte beteuert, dass nicht Ruprecht der Täter sein kann. Sie habe in der gestrigen Nacht einen heftigen Streit zwischen Eve und einem fremden Mann belauscht. Dieser ist kahlköpfig und habe einen Pferdefuß, mit dem er eine Spur hinterließ.</p>
            
            <p>Brigitte und Licht haben die Spur verfolgt, die bis zu dem Haus des Dorfrichters Adam führt. Die Zeugin vermutet den Teufel dahinter. Licht und Walter allerdings verdächtigen Adam als Täter. Adam spricht aber Ruprecht schuldig, worauf hin Walter für Ruprecht eine Gefängnisstrafe in Utrecht veranlasst. Dies erschreckt Eve und sie bestätigt umgehend, dass Adam der Verursacher des zerbrochenen Kruges ist. Walter verhängt die Gefängnisstrafe nun über Adam, doch dieser war bereits aus dem Gerichtssaal geflüchtet.</p>
            
            <h3 id="loesung">5. Schluss (12. – 13. Auftritt) <span class="tag">Katastrophe/Lösung</span></h3>
            
            <p>Im vorletzten Auftritt finden Ruprecht und Eve wieder zusammen, versöhnen sich und machen die Auflösung der Verlobung rückgängig. Eve klärt darüber auf, dass sie von einem Brief gewusst hätte, indem es heißt, dass Ruprecht als Soldat nach Ostindien hätte gehen müssen. Adam versprach ihr allerdings, Ruprecht von diesem Kriegsdienst mit einem Schreiben freisprechen zu können.</p>
            
            <p>Das Schreiben wollte er ihr in ihrem Zimmer aushändigen, bedrängte sie dort allerdings, was sie nicht weiter ausführen wolle. Walter entlarvt den Brief als eine Fälschung, so dass Adams Täuschung aufgedeckt wird, was auch Eve zu diesem Zeitpunkt bereits erkannt hatte. Er fordert Licht dazu auf, Adam von seiner Flucht zurückzuholen, der nun als Richter suspendiert gilt und befördert Licht als neuen Amtsinhaber.</p>
            
            <p>Im letzten kurzen Auftritt erkundigt sich Frau Marthe nach dem Regierungssitz mit der Begründung, ihr sei für den zerbrochenen Krug trotz Aufklärung des Falls noch immer kein Recht geschehen.</p>
        </section>
        
        <section id="figuren">
            <h2>Figuren</h2>
            
            <h3 id="figuren-konstellation">Figurenkonstellation</h3>
            
            <div class="figure-diagram">
                <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                    <!-- Background Rectangle -->
                    <rect x="0" y="0" width="800" height="600" fill="#f9f9f5" rx="10" ry="10"/>
                    
                    <!-- Central Question -->
                    <rect x="280" y="40" width="240" height="60" fill="white" stroke="#c0392b" stroke-width="2" rx="8" ry="8"/>
                    <text x="400" y="70" text-anchor="middle" font-weight="bold" fill="#c0392b" font-size="16">WER HAT MARTHES KRUG</text>
                    <text x="400" y="90" text-anchor="middle" font-weight="bold" fill="#c0392b" font-size="16">ZERBROCHEN?</text>
                    
                    <!-- Main Groups -->
                    <rect x="50" y="50" width="150" height="40" fill="#3498db" stroke="#2e4053" stroke-width="2" rx="5" ry="5"/>
                    <text x="125" y="75" text-anchor="middle" font-weight="bold" fill="white">Das Gericht</text>
                    
                    <rect x="50" y="380" width="150" height="40" fill="#e67e22" stroke="#2e4053" stroke-width="2" rx="5" ry="5"/>
                    <text x="125" y="405" text-anchor="middle" font-weight="bold" fill="white">Dorfbewohner</text>
                    
                    <!-- Characters -->
                    <rect x="330" y="220" width="140" height="80" fill="#c0392b" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="400" y="255" text-anchor="middle" font-weight="bold" fill="white" font-size="18">ADAM</text>
                    <text x="400" y="280" text-anchor="middle" fill="white" font-size="14">Dorfrichter (und Täter)</text>
                    
                    <rect x="130" y="130" width="140" height="70" fill="#3498db" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="200" y="160" text-anchor="middle" font-weight="bold" font-size="18">WALTER</text>
                    <text x="200" y="185" text-anchor="middle" font-size="14">Gerichtsrat</text>
                    
                    <rect x="530" y="130" width="140" height="70" fill="#3498db" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="600" y="160" text-anchor="middle" font-weight="bold" font-size="18">LICHT</text>
                    <text x="600" y="185" text-anchor="middle" font-size="14">Gerichtsschreiber</text>
                    
                    <rect x="130" y="330" width="140" height="70" fill="#e67e22" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="200" y="360" text-anchor="middle" font-weight="bold" font-size="18">RUPRECHT</text>
                    <text x="200" y="385" text-anchor="middle" font-size="14">Angeklagter</text>
                    
                    <rect x="530" y="330" width="140" height="70" fill="#e67e22" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="600" y="360" text-anchor="middle" font-weight="bold" font-size="18">EVE</text>
                    <text x="600" y="385" text-anchor="middle" font-size="14">Zeugin</text>
                    
                    <rect x="130" y="450" width="140" height="70" fill="#e67e22" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="200" y="480" text-anchor="middle" font-weight="bold" font-size="18">VEIT</text>
                    <text x="200" y="505" text-anchor="middle" font-size="14">Zeuge</text>
                    
                    <rect x="530" y="450" width="140" height="70" fill="#e67e22" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="600" y="480" text-anchor="middle" font-weight="bold" font-size="18">MARTHE</text>
                    <text x="600" y="505" text-anchor="middle" font-size="14">Klägerin</text>
                    
                    <rect x="330" y="420" width="140" height="70" fill="#e67e22" stroke="#2e4053" stroke-width="2" rx="8" ry="8"/>
                    <text x="400" y="450" text-anchor="middle" font-weight="bold" font-size="18">Frau Brigitte</text>
                    <text x="400" y="475" text-anchor="middle" font-size="14">Letzte Zeugin</text>
                    
                    <!-- Relationships with background for better readability -->
                    <!-- Walter to Adam -->
                    <line x1="210" y1="200" x2="330" y2="250" stroke="#2e4053" stroke-width="2"/>
                    <rect x="220" y="205" width="120" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="280" y="220" text-anchor="middle" font-size="12">kontrolliert/überwacht</text>
                    
                    <!-- Licht to Adam -->
                    <line x1="590" y1="200" x2="470" y2="250" stroke="#2e4053" stroke-width="2"/>
                    <rect x="480" y="205" width="120" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="540" y="220" text-anchor="middle" font-size="12">durchschaut/konkurriert</text>
                    
                    <!-- Adam to Eve -->
                    <line x1="470" y1="260" x2="540" y2="330" stroke="#2e4053" stroke-width="2"/>
                    <rect x="480" y="280" width="80" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="520" y="295" text-anchor="middle" font-size="12">begehrt/bedrängt</text>
                    
                    <!-- Adam to Ruprecht -->
                    <line x1="330" y1="260" x2="260" y2="330" stroke="#2e4053" stroke-width="2"/>
                    <rect x="240" y="280" width="110" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="295" y="295" text-anchor="middle" font-size="12">Nebenbuhler/verurteilt</text>
                    
                    <!-- Marthe to Eve -->
                    <line x1="600" y1="450" x2="600" y2="400" stroke="#2e4053" stroke-width="2"/>
                    <rect x="570" y="415" width="60" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="600" y="430" text-anchor="middle" font-size="12">Mutter</text>
                    
                    <!-- Veit to Ruprecht -->
                    <line x1="200" y1="450" x2="200" y2="400" stroke="#2e4053" stroke-width="2"/>
                    <rect x="170" y="415" width="60" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="200" y="430" text-anchor="middle" font-size="12">Vater</text>
                    
                    <!-- Eve to Ruprecht -->
                    <line x1="530" y1="365" x2="270" y2="365" stroke="#2e4053" stroke-width="2"/>
                    <rect x="370" y="345" width="60" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="400" y="360" text-anchor="middle" font-size="12">Verlobte</text>
                    <text x="320" y="365" font-size="18">❤</text>
                    <text x="480" y="365" font-size="18">❤</text>
                    
                    <!-- Walter to Licht -->
                    <line x1="270" y1="165" x2="530" y2="165" stroke="#2e4053" stroke-width="2"/>
                    <rect x="370" y="145" width="60" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="400" y="160" text-anchor="middle" font-size="12">Kooperation</text>
                    
                    <!-- Brigitte to Adam -->
                    <line x1="400" y1="420" x2="400" y2="300" stroke="#2e4053" stroke-width="2"/>
                    <rect x="310" y="350" width="180" height="20" fill="white" fill-opacity="0.8" rx="5" ry="5"/>
                    <text x="400" y="365" text-anchor="middle" font-size="12">liefert entscheidende Beweise gegen</text>
                </svg>
            </div>
            
            <h3 id="adam">Dorfrichter Adam</h3>
            <div class="character-card">
                <h3>Dorfrichter Adam</h3>
                <h4>Äußerliche Merkmale:</h4>
                <ul>
                    <li>Kahlköpfig</li>
                    <li>Besitzt einen Klumpfuß</li>
                    <li>Am Beginn des Stücks: zerkratztes Gesicht, Verletzungen an Nase und Augen</li>
                    <li>Stattliche Leibesfülle</li>
                </ul>
                
                <h4>Lebensumstände:</h4>
                <ul>
                    <li>Ist seit 10 Jahren Dorfrichter in Huisum</li>
                    <li>Junggeselle (unverheiratet) - hat eine negative Sicht auf die Ehe</li>
                    <li>Wohnt im Gerichtshof</li>
                    <li>Hat sein Amt durch Vetternschaft und Bestechung erlangt</li>
                </ul>
                
                <h4>Charaktereigenschaften:</h4>
                <p>Adam verhält sich vor allem den Mägden gegenüber dominant und herrisch. Im herablassenden Tonfall gibt er Befehle und kennzeichnet dadurch deutlich die Hierarchie. So werden auch seine Arroganz und selbstherrliche Art kenntlich, die auch durch seine teilweise eloquente Ausdrucksweise anderen Gesprächspartnern gegenüber unterstrichen wird.</p>
                
                <p>Er scheint von seinem unantastbaren Status als Richter stark überzeugt zu sein. So nutzt er seine Autoritätsposition schamlos aus und gibt sich dabei selbstsüchtig, unmoralisch und rücksichtslos. Nicht nur, weil er Eve eine Lüge aufträgt, mit der er sie erpressen, sich so Zugang zu ihr zu verschaffen und sie sexuell zu belästigen versucht. Auch scheint er gewissenlos genug, um über einen Unschuldigen für sein eigenes Verbrechen eine Gefängnisstrafe zu verhängen.</p>
                
                <p>Allerdings verschätzt sich Adam in seiner Selbstsicherheit und ist Licht tatsächlich moralisch und geistig unterlegen, was ihm nicht bewusst zu sein scheint. Er handelt unüberlegt und improvisiert. Adam realisiert, dass ihn Walters Besuch in Schwierigkeiten bringen könnte. So präsentiert er immer wieder neue spontane Lösungsideen, um von sich abzulenken.</p>
                
                <blockquote class="quote">
                    Sein Name verrät eine Anspielung auf die Bibelgeschichte, in der Adam als Stellvertreter für alles Menschliche das Sündigen repräsentiert. Auch der Dorfrichter Adam ist eine von Sünde geprägte Persönlichkeit, die ihren Gelüsten verfällt und rücksichtslos wie unbedacht handelt.
                </blockquote>
            </div>
            
            <h3 id="licht">Gerichtsschreiber Licht</h3>
            <div class="character-card">
                <h3>Licht</h3>
                <h4>Äußerliche Merkmale:</h4>
                <ul>
                    <li>Keine detaillierten Angaben im Text</li>
                </ul>
                
                <h4>Lebensumstände:</h4>
                <ul>
                    <li>Gerichtsschreiber in Huisum</li>
                    <li>Bereits seit 9 Jahren im Justizamt tätig</li>
                    <li>Hat in Amsterdam studiert</li>
                    <li>Strebt selbst das Richteramt an</li>
                </ul>
                
                <h4>Charaktereigenschaften:</h4>
                <p>Der Protokollführer des Gerichtsprozesses Licht verhält sich zwar tendenziell passiv, dennoch nimmt er eine wichtige Rolle für die Aufklärung des Verbrechens ein. Er verkörpert Ordnung und Gerechtigkeit, wie sein Name bereits andeutet – er bringt "Licht" in die Dunkelheit der Lügen.</p>
                
                <p>Er verhält sich vorschriftsmäßig, geordnet und diszipliniert und stellt somit eine Art Gegenpol zu Adam dar. Anders als der Dorfrichter ist er bereits über das Kommen des Gerichtsrats informiert und fürchtet seinen Besuch nicht, sondern scheint dem wohlwollend gesinnt zu sein.</p>
                
                <p>Obwohl Lichts Skepsis gegenüber Adams Ausreden herauszuhören ist, zeigt er es nur subtil. Er redet mit ironischen Anspielungen, die erahnen lassen, dass er Adam durchschaut hat. Beispielsweise ahnt er, dass Adam log und seine Katze nicht in seine Perücke gejungt hat. Doch er ist überzeugt, dass Gerechtigkeit walten wird, ohne dass er sich illoyal verhalten oder Ehrlichkeit in Frage stellen muss.</p>
                
                <p>Gegen Ende des Prozesses scheint Licht ungeduldiger zu werden. Er wünscht sich, dass das Verbrechen endlich aufgeklärt wird und gibt nun aktive Hinweise, um die Aufmerksamkeit auf Adams Verstrickung in das Verbrechen zu lenken.</p>
                
                <blockquote class="quote">
                    Im Laufe des Stücks durchläuft Lichts Verhalten einen kleinen Wandel. Zunächst erscheint er als der treue und untergebene Gehilfe des Dorfrichters. Doch es wird zunehmend deutlich, dass er Adam heimlich überlegen ist. Seinem Charakter aber bleibt er durchweg treu. Ihn zeichnet Klugheit, Ehrlichkeit, Ordnungsliebe, Vorschriften- und Gesetzestreue, Rationalität und Kontrolle aus.
                </blockquote>
            </div>
            
            <h3 id="walter">Gerichtsrat Walter</h3>
            <div class="character-card">
                <h3>Walter</h3>
                <h4>Äußerliche Merkmale:</h4>
                <ul>
                    <li>Eine gestauchte Hand (erwähnt in Dokument 3)</li>
                </ul>
                
                <h4>Lebensumstände:</h4>
                <ul>
                    <li>Gerichtsrat und höchste Amtsperson im Stück</li>
                    <li>Vorgesetzter von Adam</li>
                    <li>Reist durch das Land, um die Qualität der Rechtsprechung zu prüfen</li>
                </ul>
                
                <h4>Charaktereigenschaften:</h4>
                <p>Noch bevor der Gerichtsrat Walter im Gerichtssaal des Dorfrichters erscheint, um die Rechtmäßigkeit der Dorfjustiz zu überprüfen, erhält der/die Leser:in zunächst einen sehr ernsten und Respekt einflößenden Eindruck von Walters Persönlichkeit. Schließlich sei er indirekt verantwortlich für den Tod eines Kollegen Adams, der von Walter suspendiert wurde und sich anschließend erhängte.</p>
                
                <p>Im Gegensatz dazu stellt sich Walter bei seiner Ankunft als wohlwollender und barmherziger Mensch vor. Er deklariert: "Ich meins von Herzen gut, schon wenn ich komme" und sieht scheinbar von harten Bestrafungen ab. Er strebt energisch danach, dass Ordnung eingehalten wird und sehnt sich nach weiteren Vorschriften, die noch mehr Ordnung herstellen.</p>
                
                <p>Walters Charakter ist stark von seiner Ungeduld geprägt. Die Verzögerungen und der nicht vorschriftsgemäße Ablauf der Gerichtsverhandlung machen ihn nervös und wütend. Immer wieder schreitet er ein, um die anwesenden Parteien zurechtzuweisen und den Fortgang zu beschleunigen.</p>
                
                <p>Von Adam ist der Gerichtsrat besonders genervt und gibt ihm dies zu spüren. Dadurch schreitet er ständig in den Prozess ein und versucht, diesen zu steuern. Er hält Adam für inkompetent, gewährt ihm aber dennoch die Führung und fordert ihn immer wieder auf, die Verhandlung zügig und vorschriftsmäßig zu Ende zu bringen.</p>
                
                <blockquote class="quote">
                    Walter kann als Beispiel der Personalisierung von schwerfälliger und langwieriger Bürokratie verstanden werden. Er steht für Anständigkeit, Pflichttreue und will der bestehenden Veruntreuung und Rechtsverdrehung ein Ende setzen.
                </blockquote>
            </div>
            
            <h3 id="marthe">Frau Marthe</h3>
            <div class="character-card">
                <h3>Frau Marthe</h3>
                <h4>Äußerliche Merkmale:</h4>
                <ul>
                    <li>Frau mittleren Alters (49 Jahre)</li>
                </ul>
                
                <h4>Lebensumstände:</h4>
                <ul>
                    <li>Verwitwete Frau eines Verwalters</li>
                    <li>Mutter von Eve</li>
                    <li>Lebt seit dem Tod ihres Mannes in ärmlichen Verhältnissen</li>
                    <li>Hebamme</li>
                    <li>Wohnt in der Nähe des Gerichts</li>
                </ul>
                
                <h4>Charaktereigenschaften:</h4>
                <p>Die Klägerin Frau Marthe sorgt für den Anlass der Gerichtsverhandlung, da sie Ruprecht Tümpel, den zu dem Zeitpunkt ehemaligen Verlobten ihrer Tochter Eve, beschuldigt, ihren wertvollen Krug zerbrochen zu haben. Sie steigt mit einem zornigen Auftreten in die Handlung ein und präsentiert sich als sehr wütend, während sie eine Entschädigung für den Krug einfordert.</p>
                
                <p>Frau Marthe hält stark daran fest, dass Ruprecht der Täter ist, greift ihn ständig verbal an und redet ihn schlecht. Sie lässt sich in ihrem Ärger und ihrer Obsession kaum beschwichtigen. Sie sieht in ihm keinen geeigneten Ehemann für ihre Tochter und wünscht sich jemand anderen an ihrer Seite.</p>
                
                <p>Es macht den Anschein, als halte sie stark an dem Glauben fest, dass Ruprecht den Krug zerbrochen habe, da sie nicht wahrhaben möchte, dass ein anderer Mann ihre Tochter besucht haben könnte. Die Bewahrung der Anständigkeit und eine würdige Verheiratung ihrer Tochter ist für sie von großer Bedeutung.</p>
                
                <p>Als Frau Marthe ihre Anklage über den Tathergang abgibt, hält sie eine lange Rede über die Geschichte und die persönliche Bedeutung des Kruges. Der Richter Adam sowie der Gerichtsrat Walter versuchen sie vergeblich darin abzukürzen. Doch für sie scheint die Schwere der Tat im Wert des Kruges zu liegen.</p>
                
                <blockquote class="quote">
                    Die Klägerin betont, dass die Beschädigung des Kruges nicht mehr ungeschehen zu machen ist. Analog lässt sich dies auf die Ehre, bzw. die Jungfräulichkeit ihrer Tochter Eve anwenden, die durch nächtlichen Männerbesuch gebrochen werden könnte. Demnach kann der zerbrochene Krug als metaphorischer Stellvertreter für gebrochene Würde gelten.
                </blockquote>
            </div>
            
            <h3 id="eve">Eve</h3>
            <div class="character-card">
                <h3>Eve</h3>
                <h4>Äußerliche Merkmale:</h4>
                <ul>
                    <li>Jung (genaues Alter nicht spezifiziert)</li>
                    <li>Ihr Name ist eine Anspielung auf Eva aus der biblischen Geschichte</li>
                </ul>
                
                <h4>Lebensumstände:</h4>
                <ul>
                    <li>Tochter von Frau Marthe</li>
                    <li>Verlobt mit Ruprecht</li>
                    <li>Wohnt bei ihrer Mutter</li>
                    <li>Opfer in der zentralen Auseinandersetzung des Dramas</li>
                </ul>
                
                <h4>Charaktereigenschaften:</h4>
                <p>Der Tochter der Klägerin Frau Marthe kommt eine wichtige Position in der Gerichtsverhandlung zu, schließlich gilt sie als die zum Tatzeitpunkt entscheidende Zeugin. Dennoch verhält sie sich während des gesamten Dramas tendenziell passiv, zurückhaltend und versöhnend.</p>
                
                <p>Eve war mit Ruprecht Tümpel verlobt. Der löste jedoch die Verlobung, nachdem er vermutet, dass sie ein Verhältnis zu einem anderen Mann pflegt. Während des Prozesses begegnet er ihr mit Argwohn und Beleidigungen. Sie versucht jedoch, ihn zu besänftigen und lässt sich von seiner Wut nicht anstecken.</p>
                
                <p>Eve ist innerlich zwiegespalten. Einerseits möchte sie Ruprecht von der ungerechtfertigten Anschuldigung befreien. Anderseits ist sie nicht bereit, die gestrigen Ereignisse offenzulegen und Adam bloßzustellen. Er erpresst sie mit einem Befreiungsbrief, welcher Ruprecht von einer Abschiebung nach Ostindien bewahren könnte. Demzufolge fürchtet Eve, dass Adam ihr den Brief bei der Aufdeckung seiner Tat vorenthält.</p>
                
                <p>Ebenso versetzt es sie mit Scham, dass sich Adam ihr aufgedrängt hat. Ihr sind Ehrlichkeit und Aufrichtigkeit wichtig, doch ist sie unfähig, das Ereignis richtig zu stellen und ihre Mutter zu überzeugen, von ihrer Beschuldigung abzulassen.</p>
                
                <blockquote class="quote">
                    Eve ist Ruprecht geistig überlegen und sichtlich enttäuscht darüber, dass er ihr Verhalten am gestrigen Abend und während des Prozesses nicht versteht. Ihr ist wichtig, dass sie sich durch Anstand auszeichnet und versteht sich selbst als biederes Mädchen. Sie entspricht dem verbreiteten Frauenbild der Zeit und Literatur um 1800: moralisches und tugendhaftes Verhalten sowie eine Verweigerungshaltung kennzeichnen ihren Charakter.
                </blockquote>
            </div>
            
            <h3 id="ruprecht">Ruprecht</h3>
            <div class="character-card">
                <h3>Ruprecht</h3>
                <h4>Äußerliche Merkmale:</h4>
                <ul>
                    <li>Jung (genaues Alter nicht spezifiziert)</li>
                </ul>
                
                <h4>Lebensumstände:</h4>
                <ul>
                    <li>Angeklagter im Prozess</li>
                    <li>Sohn von Veit Tümpel</li>
                    <li>Lebt bei seinem Vater</li>
                    <li>Verlobt mit Eve</li>
                    <li>Wird in den Krieg (nach Ostindien) eingezogen</li>
                    <li>Gehört einer niedrigen sozialen Schicht an</li>
                </ul>
                
                <h4>Charaktereigenschaften:</h4>
                <p>Der angehende Soldat Ruprecht wird von Frau Marthe beschuldigt, ihren wertvollen Krug zerbrochen zu haben. Schließlich fand sie ihn am vorherigen Abend im Zimmer ihrer Tochter, seiner Verlobten, wo sich der Bruch zugetragen hat. Demnach nimmt er als Angeklagter eine wichtige Position in der Gerichtsverhandlung ein und zieht durch seine aufbrausende Art viel Aufmerksamkeit auf sich.</p>
                
                <p>Seine Wut rührt allerdings nicht aus dem falschen Verdacht, vielmehr regt er sich über Eve auf, die ihm seines Glaubens nach fremdgegangen ist. Seine Wut überträgt sich ebenso auf Eves Mutter und macht nicht den zerbrochenen Krug, sondern den unbekannten Mann in Eves Zimmer am vorherigen Abend zum Gegenstand der Gerichtsverhandlung. Er wirft mit Beleidigungen um sich und nennt Eve eine "Metze".</p>
                
                <p>Ruprecht zeigt sich stark von seinen negativen Gefühlen geleitet, tritt impulsiv und impulsgesteuert auf. Er lässt sich nicht besänftigen, sein Verhalten gleicht dem eines trotzigen Kindes. Auch wenn er über die tatsächlichen Geschehnisse des gestrigen Abends nicht ausreichend informiert ist, um diese einzuordnen, verharrt er stur und engstirnig in seinen eigenen Vorstellungen.</p>
                
                <blockquote class="quote">
                    Anhand seiner Zeugenaussage erfährt der/die Leser:in von seiner ausgeprägten Eifersucht und seiner Tendenz zur Aggressivität. Als er in Eves Garten einen anderen Mann bemerkte, wurde er von seinen zornigen Gefühlen übermannt und fühlt sich einer Konkurrenzsituation ausgesetzt. Er wirkt durch seinen fehlenden Verstand und mangelnde Kontrolle leicht dümmlich und unreif, ist aber grundsätzlich ehrlich, aufrichtig und gutgläubig.
                </blockquote>
            </div>
            
            <h3 id="nebenfiguren">Nebenfiguren</h3>
            <div class="flex-container">
                <div class="flex-item">
                    <h4>Veit Tümpel</h4>
                    <ul>
                        <li>Ruprechts Vater</li>
                        <li>Um den guten Ruf seines Sohnes besorgt</li>
                        <li>Vertraut Ruprecht zunächst</li>
                        <li>Stellt im Verlauf des Stücks die Wahrheitsliebe über die Vaterliebe</li>
                        <li>Zeigt sich versöhnlich und zurückhaltend</li>
                    </ul>
                </div>
                
                <div class="flex-item">
                    <h4>Frau Brigitte</h4>
                    <ul>
                        <li>Zusätzliche Zeugin, die gegen Ende des Prozesses auftritt</li>
                        <li>Bringt das entscheidende Beweisstück (Adams Perücke)</li>
                        <li>Hat in der Nacht einen heftigen Streit zwischen Eve und dem "Teufel" belauscht</li>
                        <li>Berichtet von einem Mann mit Klumpfuß, der eine Spur hinterließ</li>
                        <li>Verfolgte mit Licht die Spur bis zum Haus des Dorfrichters</li>
                        <li>Durch ihren Aberglauben (Teufelsvorstellung) verzögert sie kurzzeitig die Aufklärung</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- The HTML content continues, but truncated for brevity -->
        
        <!-- Rest of the HTML content would go here -->

        <footer>
            <p>© 2025 - Heinrich von Kleist: Der zerbrochne Krug - Umfassende Analyse</p>
            <p>Diese Analyse verwendet Materialien aus School-Scout und anderen Quellen.</p>
            <p>Zusammengestellt, um besser Informationen zu veranschaulichen.</p>
            <p>-Nandor Koch-</p>
        </footer>
    </main>
</div>

<!-- Add back to top button -->
<button class="back-to-top" title="Zurück nach oben"></button>
<!-- End of HTML content -->
`;

// Extend Window interface to add our custom properties
declare global {
    interface Window {
        trackCurrentSection: (sectionId: string, sectionTitle: string) => void;
        lastTrackedSection: string;
    }
}

export default LiteraryAnalysisContent;