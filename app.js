/**
 * Coverly AI — Core Application Logic
 * Form validations, PDF Parsing, API Client Routing, and Exporters.
 */

// State Management
const state = {
  apiKey: localStorage.getItem('coverly_api_key') || '',
  resumeText: '',
  generatedMarkdown: '',
  isGenerating: false,
  selectedSkills: [],
};

// DOM Cache
const dom = {
  form: document.getElementById('coverLetterForm'),
  candidateName: document.getElementById('candidateName'),
  jobRole: document.getElementById('jobRole'),
  roleDropdownToggle: document.getElementById('roleDropdownToggle'),
  roleDropdownMenu: document.getElementById('roleDropdownMenu'),
  companyName: document.getElementById('companyName'),

  // Skills Multi-Select elements
  tagsInputWrapper: document.getElementById('tagsInputWrapper'),
  skillsTagsContainer: document.getElementById('skillsTagsContainer'),
  skillInput: document.getElementById('skillInput'),
  skillsDropdownToggle: document.getElementById('skillsDropdownToggle'),
  skillsDropdownMenu: document.getElementById('skillsDropdownMenu'),
  quickSkillsContainer: document.getElementById('quickSkillsContainer'),
  skillsError: document.getElementById('skillsError'),

  // Job Description
  jobDescription: document.getElementById('jobDescription'),
  jobDescError: document.getElementById('jobDescError'),

  // Errors
  nameError: document.getElementById('nameError'),
  roleError: document.getElementById('roleError'),
  companyError: document.getElementById('companyError'),

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

// 
// Initialization & Setup
// 
document.addEventListener('DOMContentLoaded', () => {
  // Update badge and inputs based on key state
  updateApiStatusIndicator();

  if (state.apiKey) {
    dom.apiKeyInput.value = state.apiKey;
  }

  setupEventListeners();
  setupJobRoleDropdown();
  setupSkillsDropdown();
});

function setupEventListeners() {
  // Form submission
  dom.form.addEventListener('submit', handleFormSubmit);

  // Input validations on blur
  dom.candidateName.addEventListener('blur', () => validateField(dom.candidateName, dom.nameError));
  dom.jobRole.addEventListener('blur', () => {
    // Small delay to allow click on dropdown items to register before field validation
    setTimeout(() => validateField(dom.jobRole, dom.roleError), 150);
  });
  dom.companyName.addEventListener('blur', () => validateField(dom.companyName, dom.companyError));

  if (dom.jobDescription) {
    dom.jobDescription.addEventListener('blur', () => {
      if (dom.jobDescError) validateField(dom.jobDescription, dom.jobDescError);
    });
  }

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
  dom.downloadPdfBtn.addEventListener('click', handleDownloadPdf);
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

// Custom Job Role Dropdown Logic
const POPULAR_JOB_ROLES = [
  { role: 'Frontend Developer', category: 'Engineering' },
  { role: 'Senior Frontend Engineer', category: 'Engineering' },
  { role: 'Backend Developer', category: 'Engineering' },
  { role: 'Senior Backend Engineer', category: 'Engineering' },
  { role: 'Full Stack Developer', category: 'Engineering' },
  { role: 'MERN Stack Developer', category: 'Engineering' },
  { role: 'Software Engineer', category: 'Engineering' },
  { role: 'Senior Software Engineer', category: 'Engineering' },
  { role: 'React Developer', category: 'Engineering' },
  { role: 'Node.js Developer', category: 'Engineering' },
  { role: 'Java Developer', category: 'Engineering' },
  { role: 'Python Developer', category: 'Engineering' },
  { role: 'Mobile App Developer (iOS / Android)', category: 'Mobile' },
  { role: 'Flutter Developer', category: 'Mobile' },
  { role: 'DevOps Engineer', category: 'Cloud & DevOps' },
  { role: 'Cloud Solutions Architect', category: 'Cloud & DevOps' },
  { role: 'Site Reliability Engineer (SRE)', category: 'Cloud & DevOps' },
  { role: 'Data Scientist', category: 'Data & AI' },
  { role: 'Data Analyst', category: 'Data & AI' },
  { role: 'AI / Machine Learning Engineer', category: 'Data & AI' },
  { role: 'UI/UX Designer', category: 'Design' },
  { role: 'Product Designer', category: 'Design' },
  { role: 'Product Manager', category: 'Product' },
  { role: 'Project Manager / Scrum Master', category: 'Management' },
  { role: 'QA / Software Tester', category: 'QA' },
  { role: 'Cybersecurity Analyst', category: 'Security' },
  { role: 'Business Analyst', category: 'Business' },
  { role: 'Digital Marketing Specialist', category: 'Marketing' },
  { role: 'HR Manager / Recruiter', category: 'HR' },
  { role: 'Technical Content Writer', category: 'Content' }
];

let activeDropdownIndex = -1;

function setupJobRoleDropdown() {
  if (!dom.jobRole || !dom.roleDropdownMenu) return;

  // Render initial list
  renderRoleDropdown('');

  // Input event: Filter as user types
  dom.jobRole.addEventListener('input', (e) => {
    renderRoleDropdown(e.target.value.trim());
    openRoleDropdown();
  });

  // Focus event: Open dropdown when input gets focus
  dom.jobRole.addEventListener('focus', () => {
    renderRoleDropdown(dom.jobRole.value.trim());
    openRoleDropdown();
  });

  // Toggle button click
  if (dom.roleDropdownToggle) {
    dom.roleDropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dom.roleDropdownMenu.classList.contains('hidden')) {
        renderRoleDropdown(dom.jobRole.value.trim());
        openRoleDropdown();
        dom.jobRole.focus();
      } else {
        closeRoleDropdown();
      }
    });
  }

  // Keyboard navigation
  dom.jobRole.addEventListener('keydown', (e) => {
    const items = dom.roleDropdownMenu.querySelectorAll('.dropdown-item');
    if (dom.roleDropdownMenu.classList.contains('hidden') || items.length === 0) {
      if (e.key === 'ArrowDown') {
        renderRoleDropdown(dom.jobRole.value.trim());
        openRoleDropdown();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex + 1) % items.length;
      updateDropdownActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeDropdownIndex = (activeDropdownIndex - 1 + items.length) % items.length;
      updateDropdownActiveItem(items);
    } else if (e.key === 'Enter') {
      if (activeDropdownIndex >= 0 && items[activeDropdownIndex]) {
        e.preventDefault();
        selectRoleItem(items[activeDropdownIndex].dataset.role);
      }
    } else if (e.key === 'Escape') {
      closeRoleDropdown();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!dom.jobRole.contains(e.target) &&
      !dom.roleDropdownMenu.contains(e.target) &&
      !(dom.roleDropdownToggle && dom.roleDropdownToggle.contains(e.target))) {
      closeRoleDropdown();
    }
  });
}

function openRoleDropdown() {
  dom.roleDropdownMenu.classList.remove('hidden');
  if (dom.roleDropdownToggle) {
    dom.roleDropdownToggle.classList.add('open');
  }
}

function closeRoleDropdown() {
  dom.roleDropdownMenu.classList.add('hidden');
  if (dom.roleDropdownToggle) {
    dom.roleDropdownToggle.classList.remove('open');
  }
  activeDropdownIndex = -1;
}

function renderRoleDropdown(filterText = '') {
  dom.roleDropdownMenu.innerHTML = '';
  activeDropdownIndex = -1;

  const query = filterText.toLowerCase();
  const filtered = POPULAR_JOB_ROLES.filter(item =>
    item.role.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'dropdown-empty';
    emptyEl.textContent = 'No matching roles. Type your custom role!';
    dom.roleDropdownMenu.appendChild(emptyEl);
    return;
  }

  filtered.forEach((item) => {
    const li = document.createElement('div');
    li.className = 'dropdown-item';
    li.dataset.role = item.role;
    li.setAttribute('role', 'option');
    li.innerHTML = `
      <span>${highlightMatch(item.role, query)}</span>
      <span class="item-category">${item.category}</span>
    `;

    li.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent input blur before selection
      selectRoleItem(item.role);
    });

    dom.roleDropdownMenu.appendChild(li);
  });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return text;
  const match = text.slice(index, index + query.length);
  return `${text.slice(0, index)}<strong style="color: var(--secondary); font-weight:700;">${match}</strong>${text.slice(index + query.length)}`;
}

function updateDropdownActiveItem(items) {
  items.forEach((item, i) => {
    if (i === activeDropdownIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function selectRoleItem(roleName) {
  dom.jobRole.value = roleName;
  validateField(dom.jobRole, dom.roleError);
  closeRoleDropdown();
  dom.jobRole.focus()
}

// 
// Multi-Select Key Skills Logic
// 
const POPULAR_SKILLS = [
  // Programming & Frontend
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'React.js', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'HTML5 & CSS3', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Redux / State Management', category: 'Frontend' },
  { name: 'Responsive Web Design', category: 'Frontend' },

  // Backend & APIs
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'Django / FastAPI', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'Go (Golang)', category: 'Backend' },
  { name: 'C# / .NET', category: 'Backend' },
  { name: 'RESTful APIs', category: 'Backend' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'Microservices Architecture', category: 'Backend' },

  // Databases
  { name: 'SQL', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'Firebase / Supabase', category: 'Database' },
  { name: 'Prisma ORM', category: 'Database' },

  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud & DevOps' },
  { name: 'Google Cloud (GCP)', category: 'Cloud & DevOps' },
  { name: 'Microsoft Azure', category: 'Cloud & DevOps' },
  { name: 'Docker', category: 'Cloud & DevOps' },
  { name: 'Kubernetes', category: 'Cloud & DevOps' },
  { name: 'CI/CD Pipelines', category: 'Cloud & DevOps' },
  { name: 'GitHub Actions', category: 'Cloud & DevOps' },
  { name: 'Linux / Bash Scripting', category: 'Cloud & DevOps' },
  { name: 'Terraform', category: 'Cloud & DevOps' },

  // Mobile
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter / Dart', category: 'Mobile' },
  { name: 'iOS (Swift)', category: 'Mobile' },
  { name: 'Android (Kotlin)', category: 'Mobile' },

  // Data & AI
  { name: 'Machine Learning', category: 'Data & AI' },
  { name: 'Generative AI & LLMs', category: 'Data & AI' },
  { name: 'Data Analysis / Pandas', category: 'Data & AI' },
  { name: 'Power BI / Tableau', category: 'Data & AI' },

  // Design & Product
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Figma / Prototyping', category: 'Design' },
  { name: 'User Research', category: 'Design' },
  { name: 'Product Strategy', category: 'Product' },

  // Management & Methodologies
  { name: 'Agile / Scrum', category: 'Management' },
  { name: 'JIRA / Sprint Planning', category: 'Management' },
  { name: 'Project Management', category: 'Management' },

  // Core Strengths & Soft Skills
  { name: 'Problem Solving', category: 'Core Strengths' },
  { name: 'Team Leadership', category: 'Core Strengths' },
  { name: 'Cross-functional Communication', category: 'Core Strengths' },
  { name: 'Critical Thinking', category: 'Core Strengths' },
  { name: 'System Architecture & Design', category: 'Core Strengths' }
];

let activeSkillsDropdownIndex = -1;

function setupSkillsDropdown() {
  if (!dom.skillInput || !dom.skillsDropdownMenu) return;

  // Render initial tags & dropdown
  renderSkillTags();
  renderSkillsDropdown('');
  setupQuickSkills();

  // Focus on input when clicking wrapper
  if (dom.tagsInputWrapper) {
    dom.tagsInputWrapper.addEventListener('click', (e) => {
      // Don't focus if clicked on a remove button or toggle
      if (!e.target.closest('.skill-tag-remove') && !e.target.closest('.dropdown-toggle-btn')) {
        dom.skillInput.focus();
      }
    });
  }

  // Input filter event
  dom.skillInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      // If user typed comma, add the skill
      const skillToAdd = val.slice(0, -1).trim();
      if (skillToAdd) {
        addSkill(skillToAdd);
        dom.skillInput.value = '';
      }
      return;
    }
    renderSkillsDropdown(val.trim());
    openSkillsDropdown();
  });

  // Focus event
  dom.skillInput.addEventListener('focus', () => {
    renderSkillsDropdown(dom.skillInput.value.trim());
    openSkillsDropdown();
  });

  // Toggle button click
  if (dom.skillsDropdownToggle) {
    dom.skillsDropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dom.skillsDropdownMenu.classList.contains('hidden')) {
        renderSkillsDropdown(dom.skillInput.value.trim());
        openSkillsDropdown();
        dom.skillInput.focus();
      } else {
        closeSkillsDropdown();
      }
    });
  }

  // Keyboard navigation & Enter key
  dom.skillInput.addEventListener('keydown', (e) => {
    const items = dom.skillsDropdownMenu.querySelectorAll('.dropdown-item');

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!dom.skillsDropdownMenu.classList.contains('hidden') && activeSkillsDropdownIndex >= 0 && items[activeSkillsDropdownIndex]) {
        const selectedSkill = items[activeSkillsDropdownIndex].dataset.skill;
        toggleSkill(selectedSkill);
        dom.skillInput.value = '';
        renderSkillsDropdown('');
      } else if (dom.skillInput.value.trim() !== '') {
        addSkill(dom.skillInput.value.trim());
        dom.skillInput.value = '';
        renderSkillsDropdown('');
      }
      return;
    }

    if (e.key === 'Backspace' && dom.skillInput.value === '' && state.selectedSkills.length > 0) {
      // Remove last skill on backspace
      removeSkill(state.selectedSkills[state.selectedSkills.length - 1]);
      return;
    }

    if (dom.skillsDropdownMenu.classList.contains('hidden') || items.length === 0) {
      if (e.key === 'ArrowDown') {
        renderSkillsDropdown(dom.skillInput.value.trim());
        openSkillsDropdown();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSkillsDropdownIndex = (activeSkillsDropdownIndex + 1) % items.length;
      updateSkillsDropdownActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSkillsDropdownIndex = (activeSkillsDropdownIndex - 1 + items.length) % items.length;
      updateSkillsDropdownActiveItem(items);
    } else if (e.key === 'Escape') {
      closeSkillsDropdown();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!dom.tagsInputWrapper.contains(e.target) &&
      !dom.skillsDropdownMenu.contains(e.target)) {
      closeSkillsDropdown();
    }
  });
}

function openSkillsDropdown() {
  dom.skillsDropdownMenu.classList.remove('hidden');
  if (dom.skillsDropdownToggle) {
    dom.skillsDropdownToggle.classList.add('open');
  }
}

function closeSkillsDropdown() {
  dom.skillsDropdownMenu.classList.add('hidden');
  if (dom.skillsDropdownToggle) {
    dom.skillsDropdownToggle.classList.remove('open');
  }
  activeSkillsDropdownIndex = -1;
}

function addSkill(skillName) {
  const cleanName = skillName.trim();
  if (!cleanName) return;

  // Case-insensitive duplicate check
  const exists = state.selectedSkills.some(s => s.toLowerCase() === cleanName.toLowerCase());
  if (!exists) {
    state.selectedSkills.push(cleanName);
    renderSkillTags();
    updateQuickSkillPills();
    validateSkills();
  }
}

function removeSkill(skillName) {
  state.selectedSkills = state.selectedSkills.filter(s => s.toLowerCase() !== skillName.toLowerCase());
  renderSkillTags();
  renderSkillsDropdown(dom.skillInput ? dom.skillInput.value.trim() : '');
  updateQuickSkillPills();
  validateSkills();
}

function toggleSkill(skillName) {
  const exists = state.selectedSkills.some(s => s.toLowerCase() === skillName.toLowerCase());
  if (exists) {
    removeSkill(skillName);
  } else {
    addSkill(skillName);
  }
}

function renderSkillTags() {
  if (!dom.skillsTagsContainer) return;
  dom.skillsTagsContainer.innerHTML = '';

  state.selectedSkills.forEach((skill) => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `
      <span>${escapeHtml(skill)}</span>
      <button type="button" class="skill-tag-remove" aria-label="Remove ${escapeHtml(skill)}" data-skill="${escapeHtml(skill)}">&times;</button>
    `;

    tag.querySelector('.skill-tag-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeSkill(skill);
      dom.skillInput.focus();
    });

    dom.skillsTagsContainer.appendChild(tag);
  });
}

function renderSkillsDropdown(filterText = '') {
  if (!dom.skillsDropdownMenu) return;
  dom.skillsDropdownMenu.innerHTML = '';
  activeSkillsDropdownIndex = -1;

  const query = filterText.toLowerCase();
  const filtered = POPULAR_SKILLS.filter(item =>
    item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
  );

  // If user typed custom query not exact matched in popular skills, offer custom add option
  if (query && !POPULAR_SKILLS.some(item => item.name.toLowerCase() === query)) {
    const customOption = document.createElement('div');
    customOption.className = 'dropdown-item';
    customOption.dataset.skill = filterText;
    customOption.innerHTML = `
      <div class="dropdown-item-left">
        <span style="color: var(--secondary); font-weight:700;">+ Add "${escapeHtml(filterText)}"</span>
      </div>
      <span class="item-category">Custom Skill</span>
    `;

    customOption.addEventListener('mousedown', (e) => {
      e.preventDefault();
      addSkill(filterText);
      dom.skillInput.value = '';
      renderSkillsDropdown('');
      dom.skillInput.focus();
    });

    dom.skillsDropdownMenu.appendChild(customOption);
  }

  if (filtered.length === 0 && !query) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'dropdown-empty';
    emptyEl.textContent = 'Type to search or add custom skills.';
    dom.skillsDropdownMenu.appendChild(emptyEl);
    return;
  }

  filtered.forEach((item) => {
    const isSelected = state.selectedSkills.some(s => s.toLowerCase() === item.name.toLowerCase());
    const li = document.createElement('div');
    li.className = `dropdown-item ${isSelected ? 'selected' : ''}`;
    li.dataset.skill = item.name;
    li.setAttribute('role', 'option');
    li.innerHTML = `
      <div class="dropdown-item-left">
        ${isSelected ? '<span class="item-check">✓</span>' : ''}
        <span>${highlightMatch(item.name, query)}</span>
      </div>
      <span class="item-category">${item.category}</span>
    `;

    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      toggleSkill(item.name);
      renderSkillsDropdown(dom.skillInput.value.trim());
      dom.skillInput.focus();
    });

    dom.skillsDropdownMenu.appendChild(li);
  });
}

function updateSkillsDropdownActiveItem(items) {
  items.forEach((item, i) => {
    if (i === activeSkillsDropdownIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

function setupQuickSkills() {
  if (!dom.quickSkillsContainer) return;
  const pills = dom.quickSkillsContainer.querySelectorAll('.quick-skill-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const skillName = pill.dataset.skill;
      toggleSkill(skillName);
      dom.skillInput.focus();
    });
  });
  updateQuickSkillPills();
}

function updateQuickSkillPills() {
  if (!dom.quickSkillsContainer) return;
  const pills = dom.quickSkillsContainer.querySelectorAll('.quick-skill-pill');
  pills.forEach((pill) => {
    const skillName = pill.dataset.skill;
    const isSelected = state.selectedSkills.some(s => s.toLowerCase() === skillName.toLowerCase());
    if (isSelected) {
      pill.classList.add('selected');
      pill.textContent = `✓ ${skillName.replace('.js', '')}`;
    } else {
      pill.classList.remove('selected');
      pill.textContent = `+ ${skillName.replace('.js', '')}`;
    }
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function validateSkills() {
  // If user typed something in the input but forgot to hit enter, auto add it
  if (dom.skillInput && dom.skillInput.value.trim() !== '') {
    addSkill(dom.skillInput.value.trim());
    dom.skillInput.value = '';
  }

  const isValid = state.selectedSkills.length > 0;
  if (dom.tagsInputWrapper && dom.skillsError) {
    if (isValid) {
      dom.tagsInputWrapper.classList.remove('invalid');
      dom.skillsError.style.display = 'none';
    } else {
      dom.tagsInputWrapper.classList.add('invalid');
      dom.skillsError.style.display = 'block';
    }
  }
  return isValid;
}

// 
// Form Validation Logic
// 
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
  const isSkillsValid = validateSkills();

  return isNameValid && isRoleValid && isCompanyValid && isSkillsValid;
}

// 
// Drag & Drop / PDF Extract Logic (PDF.js Integration)
// 
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
  reader.onload = async function () {
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

// 
// Simulation Generator (Phase 1 MVP Fallback)
// 
function generateSimulatedLetter(name, role, company, skills, jobDescription, resumeText) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const resumeContextSection = resumeText
    ? `\n\nHaving parsed my attached background summary showing significant achievements, I am confident in connecting my past accomplishments with your current requirements.`
    : '';

  const skillsText = skills || 'specialized technical and leadership capabilities';
  const jdContext = jobDescription ? ` Specifically matching your requirements for this role, I focus on delivering scalable, reliable results.` : '';

  return `# ${name}
**Contact:** Professional Profile Attached | Generated by Coverly AI
**Date:** ${date}

**Hiring Team**
${company}
Subject: Application for **${role}** position

Dear Hiring Manager,

I am writing to express my strong interest in the **${role}** position at **${company}**. With a strong alignment in core technical capabilities and professional goals, I am excited about the opportunity to contribute to your team's upcoming initiatives.

Based on your current requirements, I bring specialized experience in **${skillsText}**.${jdContext} Throughout my career, I have prioritized high-quality executions, clean system architectures, and matching user expectations with robust software structures.${resumeContextSection}

At **${company}**, I see an organization that values innovation and impact. I am eager to apply my key skillsets to solve complex problems and contribute to your business objectives.

Thank you for your time and consideration. I welcome the opportunity to discuss how my profile matches your requirements in detail.

Sincerely,

**${name}**`;
}

// 
// AI Generating Loading Animation states
// 
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

// 
// Gemini API call & Serverless Proxy Router
// 
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
  const skills = state.selectedSkills.join(', ');
  const jobDescription = dom.jobDescription ? dom.jobDescription.value.trim() : '';
  const resume = state.resumeText.trim();

  showLoading(true);

  try {
    let coverLetterMarkdown = '';

    if (state.apiKey) {
      // User has manually entered their own API key via Settings → use direct call
      coverLetterMarkdown = await fetchGeminiDirect(name, role, company, skills, jobDescription, resume);
    } else {
      // DEFAULT: Use secure serverless proxy (API key stays on server)
      try {
        coverLetterMarkdown = await fetchGeminiProxy(name, role, company, skills, jobDescription, resume);
      } catch (proxyError) {
        console.warn('Serverless proxy failed. Falling back to Simulation Mode.', proxyError);
        // Fallback to Simulation Mode
        await new Promise(resolve => setTimeout(resolve, 1500));
        coverLetterMarkdown = generateSimulatedLetter(name, role, company, skills, jobDescription, resume);
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
    const coverLetterMarkdown = generateSimulatedLetter(name, role, company, skills, jobDescription, resume);
    state.generatedMarkdown = coverLetterMarkdown;
    renderOutputLetter(coverLetterMarkdown);
  } finally {
    showLoading(false);
  }
}

// Construct LLM Prompts
function buildSystemPrompt(name, role, company, skills, jobDescription, resumeText) {
  const resumeSnippet = resumeText
    ? `\nCandidate Resume Details (Parsed from PDF):\n${resumeText}\n`
    : '';

  const skillsSnippet = skills
    ? `- Candidate Key Skills: ${skills}`
    : '';

  const jdSnippet = jobDescription
    ? `- Target Job Description / Requirements: ${jobDescription}`
    : '';

  return `You are a highly seasoned executive career consultant. Your objective is to write an exceptionally professional, personalized, and high-impact cover letter for ${name} applying for the ${role} position at ${company}.

Key inputs:
- Candidate Name: ${name}
- Target Role: ${role}
- Target Company: ${company}
${skillsSnippet}
${jdSnippet}
${resumeSnippet}

Guidelines to ensure it DOES NOT sound AI-generated:
1. DO NOT use generic template intro lines (e.g. "I am writing to express my enthusiastic interest...", "It is with great pleasure that I submit my application...", "I am delighted to apply..."). Start with a strong, natural, hook-based intro showing immediate value alignment.
2. DO NOT use typical AI buzzwords/cliches (e.g., "pleased", "excited", "beacon", "testament", "cutting-edge", "synergy", "dynamic interface", "passionate", "furthermore", "delighted", "revolutionize"). Use direct, clear, professional language.
3. Establish a confident, clear, and humble tone. Speak like a highly competent human professional.
4. Structure the cover letter neatly:
   - Header: Candidate Name, Target Role, and Target Company info.
   - Opening Hook: Instant value hook connecting candidate's focus to the company's domain or target challenge.
   - Core Accomplishment Paragraph: Combine candidate's key skills (${skills}) and target job requirements (${jobDescription || role}) along with resume details to show direct proof of ability. Don't just list skills; state achievements and outcomes.
   - Alignment Paragraph: Showcase specific context showing why this company (${company}) is a logical next step (use details from the JD/skills to show you researched them).
   - Professional closing: Brief, call to action regarding interviews, and sign-off.
5. Keep the length balanced (around 250 - 350 words). Ensure there are clean markdown headings and paragraphs. DO NOT output code blocks or generic wrappers. Just output the clean cover letter text in markdown.`;
}

// Direct Call to Google Gemini API
async function fetchGeminiDirect(name, role, company, skills, jobDescription, resumeText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  const prompt = buildSystemPrompt(name, role, company, skills, jobDescription, resumeText);

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
async function fetchGeminiProxy(name, role, company, skills, jobDescription, resumeText) {
  const url = '/api/generate';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, role, company, skills, jobDescription, resumeText })
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

// 
// Copy and Download Exporters
// 
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

async function handleDownloadPdf() {
  if (!state.generatedMarkdown && (!dom.letterOutput || !dom.letterOutput.innerText.trim())) {
    showToast('No letter content to download!', 'warning');
    return;
  }

  const companyRaw = dom.companyName ? dom.companyName.value.trim() : '';
  const fileNameSafe = companyRaw ? companyRaw.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'generated';
  const pdfFileName = `cover_letter_${fileNameSafe}.pdf`;

  showToast('Generating PDF file...', 'info');

  if (typeof html2pdf !== 'undefined') {
    const container = document.createElement('div');
    container.style.padding = '30px 40px';
    container.style.color = '#1e293b';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = "'Plus Jakarta Sans', Arial, sans-serif";
    container.style.fontSize = '14px';
    container.style.lineHeight = '1.75';
    container.style.width = '100%';

    container.innerHTML = `
      <style>
        div, p, h1, h2, h3, li, span, strong {
          color: #1e293b !important;
          background: transparent !important;
        }
        h1, h2, h3 {
          color: #0f172a !important;
          margin-top: 14px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        p {
          margin-bottom: 12px;
        }
        ul, ol {
          margin-bottom: 12px;
          padding-left: 20px;
        }
        li {
          margin-bottom: 4px;
        }
      </style>
      <div>${dom.letterOutput.innerHTML}</div>
    `;

    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     pdfFileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(container).save();
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('html2pdf generation error:', err);
      window.print();
    }
  } else {
    window.print();
  }
}

// 
// Settings Modal & API Key Storage
// 
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

// 
// Toast Helper
// 
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
