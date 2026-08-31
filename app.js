/**
 * Coverly AI — Core Application Logic
 * Form validations, PDF Parsing, API Client Routing, and Exporters.
 */

// State Management
const state = {
  apiKey: localStorage.getItem('coverly_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '',
  resumeText: '',
  generatedMarkdown: '',
  isGenerating: false,
};

// DOM Cache
const dom = {
  form: document.getElementById('coverLetterForm'),
  candidateName: document.getElementById('candidateName'),
  jobRole: document.getElementById('jobRole'),
  companyName: document.getElementById('companyName'),
  jobDescription: document.getElementById('jobDescription'),
  
  // Errors
  nameError: document.getElementById('nameError'),
  roleError: document.getElementById('roleError'),
  companyError: document.getElementById('companyError'),
  skillsError: document.getElementById('skillsError'),
  
  // Resume elements
  dropzone: document.getElementById('dropzone'),
  resumeUpload: document.getElementById('resumeUpload'),
  fileInfo: document.getElementById('fileInfo'),
  fileName: document.getElementById('fileName'),
  removeFileBtn: document.getElementById('removeFileBtn'),
  pdfSuccessMsg: document.getElementById('pdfSuccessMsg'),
  pdfErrorMsg: document.getElementById('pdfErrorMsg'),
  
  // Submit
  submitBtn: document.getElementById('submitBtn'),
  
  // Output Panels
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  loadingTitle: document.getElementById('loadingTitle'),
  loadingDesc: document.getElementById('loadingDesc'),
  progressBar: document.getElementById('progressBar'),
  letterOutputWrapper: document.getElementById('letterOutputWrapper'),
  letterOutput: document.getElementById('letterOutput'),
  
  // Action Buttons
  previewActions: document.getElementById('previewActions'),
  copyBtn: document.getElementById('copyBtn'),
  copyBtnText: document.getElementById('copyBtnText'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  downloadTxtBtn: document.getElementById('downloadTxtBtn'),
  
  // Badges
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  apiStatusText: document.getElementById('apiStatusText'),
  
  // Settings Modal
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  toggleApiKeyBtn: document.getElementById('toggleApiKeyBtn'),
  testKeyBtn: document.getElementById('testKeyBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  apiStatusMessage: document.getElementById('apiStatusMessage'),
  
  // Toast
  toast: document.getElementById('toastNotification'),
  toastMessage: document.getElementById('toastMessage')
};

// ==========================================================================
// Initialization & Setup
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Update badge and inputs based on key state
  updateApiStatusIndicator();
  
  if (state.apiKey) {
    dom.apiKeyInput.value = state.apiKey;
  }
  
  setupEventListeners();
});

function setupEventListeners() {
  // Form submission
  dom.form.addEventListener('submit', handleFormSubmit);
  
  // Input validations on blur
  dom.candidateName.addEventListener('blur', () => validateField(dom.candidateName, dom.nameError));
  dom.jobRole.addEventListener('blur', () => validateField(dom.jobRole, dom.roleError));
  dom.companyName.addEventListener('blur', () => validateField(dom.companyName, dom.companyError));
  dom.jobDescription.addEventListener('blur', () => validateField(dom.jobDescription, dom.skillsError));
  
  // File Dropzone Events
  dom.dropzone.addEventListener('click', () => dom.resumeUpload.click());
  dom.dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dom.resumeUpload.click();
    }
  });
  
  dom.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropzone.classList.add('dragover');
  });
  
  dom.dropzone.addEventListener('dragleave', () => {
    dom.dropzone.classList.remove('dragover');
  });
  
  dom.dropzone.addEventListener('drop', handleFileDrop);
  dom.resumeUpload.addEventListener('change', handleFileSelect);
  dom.removeFileBtn.addEventListener('click', handleRemoveFile);
  
  // Exporters
  dom.copyBtn.addEventListener('click', handleCopyToClipboard);
  dom.downloadPdfBtn.addEventListener('click', () => window.print());
  dom.downloadTxtBtn.addEventListener('click', handleDownloadTxt);
  
  // Settings Modal Events
  dom.settingsBtn.addEventListener('click', openSettingsModal);
  dom.closeSettingsBtn.addEventListener('click', closeSettingsModal);
  dom.settingsModal.addEventListener('click', (e) => {
    if (e.target === dom.settingsModal) closeSettingsModal();
  });
  
  dom.toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  dom.testKeyBtn.addEventListener('click', handleTestApiKey);
  dom.saveSettingsBtn.addEventListener('click', handleSaveSettings);
}

// ==========================================================================
// Form Validation Logic
// ==========================================================================
function validateField(inputEl, errorEl) {
  const isValid = inputEl.value.trim() !== '';
  if (isValid) {
    inputEl.classList.remove('invalid');
    inputEl.setAttribute('aria-invalid', 'false');
  } else {
    inputEl.classList.add('invalid');
    inputEl.setAttribute('aria-invalid', 'true');
  }
  return isValid;
}

function validateForm() {
  const isNameValid = validateField(dom.candidateName, dom.nameError);
  const isRoleValid = validateField(dom.jobRole, dom.roleError);
  const isCompanyValid = validateField(dom.companyName, dom.companyError);
  const isSkillsValid = validateField(dom.jobDescription, dom.skillsError);
  
  return isNameValid && isRoleValid && isCompanyValid && isSkillsValid;
}

// ==========================================================================
// Drag & Drop / PDF Extract Logic (PDF.js Integration)
// ==========================================================================
function handleFileDrop(e) {
  e.preventDefault();
  dom.dropzone.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processUploadedFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processUploadedFile(files[0]);
  }
}

function processUploadedFile(file) {
  if (file.type !== 'application/pdf') {
    showPdfStatus('error', 'Please upload a PDF document.');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showPdfStatus('error', 'File size exceeds 5MB limit.');
    return;
  }
  
  // Show file info in UI
  dom.fileName.textContent = file.name;
  dom.dropzone.querySelector('.dropzone-content').classList.add('hidden');
  dom.fileInfo.classList.remove('hidden');
  
  // Read and parse PDF
  showPdfStatus('loading', 'Parsing resume content...');
  
  const reader = new FileReader();
  reader.onload = async function() {
    try {
      const arrayBuffer = this.result;
      const text = await extractTextFromPdfBuffer(arrayBuffer);
      state.resumeText = text;
      showPdfStatus('success', 'Resume parsed successfully!');
    } catch (error) {
      console.error('PDF JS Parsing error: ', error);
      showPdfStatus('error', 'Could not extract text. PDF might be scanned or protected.');
    }
  };
  
  reader.onerror = () => {
    showPdfStatus('error', 'Error reading file.');
  };
  
  reader.readAsArrayBuffer(file);
}

async function extractTextFromPdfBuffer(arrayBuffer) {
  // Ensure PDF.js CDN library is loaded
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library is not loaded yet. Check internet connection.');
  }
  
  // Configure PDF.js Worker Src
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  if (fullText.trim().length === 0) {
    throw new Error('No text found in PDF');
  }
  
  return fullText;
}

function handleRemoveFile(e) {
  e.stopPropagation();
  dom.resumeUpload.value = '';
  dom.fileInfo.classList.add('hidden');
  dom.dropzone.querySelector('.dropzone-content').classList.remove('hidden');
  
  state.resumeText = '';
  
  dom.pdfSuccessMsg.classList.add('hidden');
  dom.pdfErrorMsg.classList.add('hidden');
}

function showPdfStatus(type, message) {
  dom.pdfSuccessMsg.classList.add('hidden');
  dom.pdfErrorMsg.classList.add('hidden');
  
  if (type === 'success') {
    dom.pdfSuccessMsg.textContent = message;
    dom.pdfSuccessMsg.classList.remove('hidden');
  } else if (type === 'error') {
    dom.pdfErrorMsg.textContent = message;
    dom.pdfErrorMsg.classList.remove('hidden');
    // revert file indicator
    handleRemoveFile(new Event('click'));
  } else if (type === 'loading') {
    dom.pdfSuccessMsg.textContent = message;
    dom.pdfSuccessMsg.classList.remove('hidden');
  }
}

// ==========================================================================
// Simulation Generator (Phase 1 MVP Fallback)
// ==========================================================================
function generateSimulatedLetter(name, role, company, skills, resumeText) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const resumeContextSection = resumeText 
    ? `\n\nHaving parsed my attached background summary showing significant achievements, I am confident in connecting my past accomplishments with your current requirements.`
    : '';

  return `# ${name}
**Contact:** Professional Profile Attached | Generated by Coverly AI
**Date:** ${date}

**Hiring Team**
${company}
Subject: Application for **${role}** position

Dear Hiring Manager,

I am writing to express my strong interest in the **${role}** position at **${company}**. With a strong alignment in core technical skills and professional goals, I am excited about the opportunity to contribute to your team's upcoming initiatives.

Based on your current requirements, I bring specialized experience in **${skills}**. Throughout my career, I have prioritized high-quality executions, clean system architectures, and matching user expectations with robust software structures.${resumeContextSection}

At **${company}**, I see an organization that values innovation and impact. I am eager to apply my key skillsets to solve complex problems and contribute to your business objectives.

Thank you for your time and consideration. I welcome the opportunity to discuss how my profile matches your requirements in detail.

Sincerely,

**${name}**`;
}

// ==========================================================================
// AI Generating Loading Animation states
// ==========================================================================
let loadingInterval = null;

function showLoading(show) {
  state.isGenerating = show;
  dom.submitBtn.disabled = show;
  
  if (show) {
    dom.emptyState.classList.add('hidden');
    dom.letterOutputWrapper.classList.add('hidden');
    dom.previewActions.classList.add('disabled');
    dom.previewActions.querySelectorAll('button').forEach(btn => btn.disabled = true);
    dom.loadingState.classList.remove('hidden');
    
    // Animate loader texts
    const statuses = [
      { pct: 15, title: 'Initiating Generator', desc: 'Analyzing state variables and inputs...' },
      { pct: 35, title: 'Reading Profile Data', desc: 'Parsing skills and resume keywords...' },
      { pct: 60, title: 'Structuring Narrative', desc: 'Organizing cover letter hierarchy...' },
      { pct: 85, title: 'Refining Persona', desc: 'Drafting professional, non-robotic tone...' },
      { pct: 98, title: 'Finalizing Letter', desc: 'Optimizing layout, paragraphs, and styles...' }
    ];
    
    let stepIndex = 0;
    dom.progressBar.style.width = '0%';
    dom.loadingTitle.textContent = statuses[0].title;
    dom.loadingDesc.textContent = statuses[0].desc;
    
    loadingInterval = setInterval(() => {
      if (stepIndex < statuses.length - 1) {
        stepIndex++;
        dom.progressBar.style.width = `${statuses[stepIndex].pct}%`;
        dom.loadingTitle.textContent = statuses[stepIndex].title;
        dom.loadingDesc.textContent = statuses[stepIndex].desc;
      }
    }, 900);
    
  } else {
    clearInterval(loadingInterval);
    dom.loadingState.classList.add('hidden');
    dom.submitBtn.disabled = false;
  }
}

// ==========================================================================
// Gemini API call & Serverless Proxy Router
// ==========================================================================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    // Focus first invalid element
    const firstInvalid = dom.form.querySelector('.invalid');
    if (firstInvalid) firstInvalid.focus();
    return;
  }
  
  const name = dom.candidateName.value.trim();
  const role = dom.jobRole.value.trim();
  const company = dom.companyName.value.trim();
  const skills = dom.jobDescription.value.trim();
  const resume = state.resumeText.trim();
  
  showLoading(true);
  
  // Decide whether to run Simulation or AI mode
  const apiMode = state.apiKey ? 'direct' : 'proxy';
  
  try {
    let coverLetterMarkdown = '';
    
    if (apiMode === 'direct') {
      coverLetterMarkdown = await fetchGeminiDirect(name, role, company, skills, resume);
    } else {
      // Check if proxy serverless route works
      try {
        coverLetterMarkdown = await fetchGeminiProxy(name, role, company, skills, resume);
      } catch (proxyError) {
        console.warn('Proxy generation failed or not set up. Falling back to Simulation Mode.', proxyError);
        // Fallback to Phase 1 Simulation Mode
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work latency
        coverLetterMarkdown = generateSimulatedLetter(name, role, company, skills, resume);
        showToast('Running in Simulation Mode (Fallback)');
      }
    }
    
    // Save output
    state.generatedMarkdown = coverLetterMarkdown;
    renderOutputLetter(coverLetterMarkdown);
    
  } catch (error) {
    console.error('Generation Error: ', error);
    showToast('Failed to generate. Please check API Key/Connection.', 'error');
    
    // Safe Fallback to simulation
    const coverLetterMarkdown = generateSimulatedLetter(name, role, company, skills, resume);
    state.generatedMarkdown = coverLetterMarkdown;
    renderOutputLetter(coverLetterMarkdown);
  } finally {
    showLoading(false);
  }
}

// Construct LLM Prompts
function buildSystemPrompt(name, role, company, skills, resumeText) {
  const resumeSnippet = resumeText 
    ? `Candidate Resume Details (Parsed from PDF):\n${resumeText}\n` 
    : '';

  return `You are a highly seasoned executive career consultant. Your objective is to write an exceptionally professional, personalized, and high-impact cover letter for ${name} applying for the ${role} position at ${company}.

Key inputs:
- Candidate Name: ${name}
- Target Role: ${role}
- Target Company: ${company}
- Key Skills/JD Requirements: ${skills}
${resumeSnippet}

Guidelines to ensure it DOES NOT sound AI-generated:
1. DO NOT use generic template intro lines (e.g. "I am writing to express my enthusiastic interest...", "It is with great pleasure that I submit my application...", "I am delighted to apply..."). Start with a strong, natural, hook-based intro showing immediate value alignment.
2. DO NOT use typical AI buzzwords/cliches (e.g., "pleased", "excited", "beacon", "testament", "cutting-edge", "synergy", "dynamic interface", "passionate", "furthermore", "delighted", "revolutionize"). Use direct, clear, professional language.
3. Establish a confident, clear, and humble tone. Speak like a highly competent human professional.
4. Structure the cover letter neatly:
   - Header: Candidate Name, Target Role, and Target Company info.
   - Opening Hook: Instant value hook connecting candidate's focus to the company's domain or target challenge.
   - Core Accomplishment Paragraph: Combine key skills (${skills}) and resume details to show direct proof of ability. Don't just list skills; state achievements and outcomes.
   - Alignment Paragraph: Showcase specific context showing why this company (${company}) is a logical next step (use details from the JD/skills to show you researched them).
   - Professional closing: Brief, call to action regarding interviews, and sign-off.
5. Keep the length balanced (around 250 - 350 words). Ensure there are clean markdown headings and paragraphs. DO NOT output code blocks or generic wrappers. Just output the clean cover letter text in markdown.`;
}

// Direct Call to Google Gemini API
async function fetchGeminiDirect(name, role, company, skills, resumeText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  const prompt = buildSystemPrompt(name, role, company, skills, resumeText);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `API HTTP Error status: ${response.status}`);
  }
  
  const data = await response.json();
  const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResult) {
    throw new Error('Empty response received from Gemini API');
  }
  
  return textResult;
}

// Serverless Function Request
async function fetchGeminiProxy(name, role, company, skills, resumeText) {
  const url = '/api/generate';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, role, company, skills, resumeText })
  });
  
  if (!response.ok) {
    throw new Error(`Serverless Proxy error status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.text;
}

// Renders markdown output to HTML
function renderOutputLetter(markdown) {
  dom.letterOutputWrapper.classList.remove('hidden');
  
  // Use Marked library from CDN with fallback parsing
  if (typeof marked !== 'undefined') {
    dom.letterOutput.innerHTML = marked.parse(markdown);
  } else {
    // Basic fallback paragraph generator if offline
    dom.letterOutput.innerHTML = markdown
      .split('\n\n')
      .map(p => {
        if (p.startsWith('#')) return `<h2>${p.replace(/#/g, '').trim()}</h2>`;
        return `<p>${p.replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>')}</p>`;
      })
      .join('');
  }
  
  // Enable exporters
  dom.previewActions.classList.remove('disabled');
  dom.previewActions.querySelectorAll('button').forEach(btn => btn.disabled = false);
  
  // Scroll to output
  dom.letterOutputWrapper.scrollTop = 0;
  dom.letterOutput.focus();
}

// ==========================================================================
// Copy and Download Exporters
// ==========================================================================
async function handleCopyToClipboard() {
  if (!state.generatedMarkdown) return;
  
  try {
    // Try to copy plain text representation (stripping basic markdown headers for clean pasting)
    const plainText = dom.letterOutput.innerText || state.generatedMarkdown;
    await navigator.clipboard.writeText(plainText);
    
    // Feedback animation
    dom.copyBtnText.textContent = 'Copied!';
    dom.copyBtn.classList.add('success');
    showToast('Cover letter copied to clipboard!');
    
    setTimeout(() => {
      dom.copyBtnText.textContent = 'Copy Letter';
      dom.copyBtn.classList.remove('success');
    }, 2000);
  } catch (err) {
    console.error('Clipboard copy error: ', err);
    showToast('Failed to copy to clipboard', 'error');
  }
}

function handleDownloadTxt() {
  if (!state.generatedMarkdown) return;
  
  const plainText = dom.letterOutput.innerText || state.generatedMarkdown;
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const fileNameSafe = dom.companyName.value.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `cover_letter_${fileNameSafe}.txt`;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Text file downloaded successfully!');
}

// ==========================================================================
// Settings Modal & API Key Storage
// ==========================================================================
function openSettingsModal() {
  dom.settingsModal.classList.remove('hidden');
  dom.apiKeyInput.focus();
  
  // Clear modal errors
  dom.apiStatusMessage.className = 'api-status-message';
  dom.apiStatusMessage.innerHTML = '';
}

function closeSettingsModal() {
  dom.settingsModal.classList.add('hidden');
}

function toggleApiKeyVisibility() {
  const type = dom.apiKeyInput.type === 'password' ? 'text' : 'password';
  dom.apiKeyInput.type = type;
  dom.toggleApiKeyBtn.textContent = type === 'password' ? '👁️' : '🔒';
}

async function handleTestApiKey() {
  const testKey = dom.apiKeyInput.value.trim();
  
  if (!testKey) {
    showModalStatus('warning', 'Please enter an API Key to test.');
    return;
  }
  
  showModalStatus('warning', 'Testing connection to Gemini API...');
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${testKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with the word: Success' }] }]
      })
    });
    
    if (response.ok) {
      showModalStatus('success', 'API Connection Successful!');
    } else {
      const err = await response.json().catch(() => ({}));
      showModalStatus('error', `Connection Failed: ${err.error?.message || response.statusText}`);
    }
  } catch (error) {
    showModalStatus('error', `Connection Failed: ${error.message}`);
  }
}

function handleSaveSettings() {
  const savedKey = dom.apiKeyInput.value.trim();
  
  if (savedKey) {
    localStorage.setItem('coverly_api_key', savedKey);
    state.apiKey = savedKey;
    showToast('API Key configured locally!');
  } else {
    localStorage.removeItem('coverly_api_key');
    state.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    showToast('Key cleared. App will default to Environment/Proxy mode.');
  }
  
  updateApiStatusIndicator();
  closeSettingsModal();
}

function showModalStatus(type, message) {
  dom.apiStatusMessage.className = `api-status-message ${type}`;
  dom.apiStatusMessage.textContent = message;
}

function updateApiStatusIndicator() {
  if (state.apiKey) {
    dom.apiStatusBadge.className = 'badge badge-connected';
    dom.apiStatusText.textContent = 'API Connected';
  } else {
    dom.apiStatusBadge.className = 'badge badge-simulating';
    dom.apiStatusText.textContent = 'Proxy / Simulation';
  }
}

// ==========================================================================
// Toast Helper
// ==========================================================================
let toastTimeout = null;

function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  
  dom.toastMessage.textContent = message;
  dom.toast.className = 'toast';
  
  if (type === 'error') {
    dom.toast.classList.add('error');
    dom.toast.querySelector('.toast-icon').textContent = '✗';
    dom.toast.querySelector('.toast-icon').style.color = 'var(--error)';
    dom.toast.querySelector('.toast-icon').style.backgroundColor = 'var(--error-bg)';
  } else {
    dom.toast.querySelector('.toast-icon').textContent = '✓';
    dom.toast.querySelector('.toast-icon').style.color = 'var(--success)';
    dom.toast.querySelector('.toast-icon').style.backgroundColor = 'var(--success-bg)';
  }
  
  dom.toast.classList.remove('hidden');
  
  toastTimeout = setTimeout(() => {
    dom.toast.classList.add('hidden');
  }, 3000);
}
