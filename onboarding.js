const form = document.getElementById('intake-form');
const successState = document.getElementById('success-state');
const progressFill = document.getElementById('progress-fill');
const currentStepEl = document.getElementById('current-step');
const totalSteps = 3;

function updateProgress(step) {
    const percentage = (step / totalSteps) * 100;
    progressFill.style.width = percentage + '%';
    currentStepEl.innerText = step;
}

function nextStep(currentStep) {
    const currentFieldset = document.getElementById(`step-${currentStep}`);
    const inputs = currentFieldset.querySelectorAll('input:required, textarea:required, select:required');

    let valid = true;
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.reportValidity();
            valid = false;
        }
    });

    if (valid) {
        currentFieldset.classList.remove('active');
        const nextStepNum = currentStep + 1;
        const nextFieldset = document.getElementById(`step-${nextStepNum}`);
        if (nextFieldset) {
            nextFieldset.classList.add('active');
            updateProgress(nextStepNum);
        }
    }
}

function prevStep(currentStep) {
    const currentFieldset = document.getElementById(`step-${currentStep}`);
    currentFieldset.classList.remove('active');

    const prevStepNum = currentStep - 1;
    const prevFieldset = document.getElementById(`step-${prevStepNum}`);
    if (prevFieldset) {
        prevFieldset.classList.add('active');
        updateProgress(prevStepNum);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Populate Print Letterhead
    document.getElementById('p-company').innerText = document.getElementById('company-name').value;
    document.getElementById('p-website').innerText = document.getElementById('website-url').value || 'N/A';
    document.getElementById('p-competitors').innerText = document.getElementById('competitors').value || 'None listed';

    // Get checked goals
    const goals = Array.from(document.querySelectorAll('input[name="technical_goals"]:checked')).map(cb => cb.value);
    document.getElementById('p-goals').innerText = goals.length ? goals.join(', ') : 'No specific goals selected';

    document.getElementById('p-inspiration').innerText = document.getElementById('design-inspiration').value || 'None provided';
    document.getElementById('p-deadline').innerText = document.getElementById('target-deadline').value;
    document.getElementById('p-budget').innerText = document.getElementById('budget').value;

    // Set Date
    const now = new Date();
    document.getElementById('print-date').innerText = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Send Data to Server
    const formData = new FormData(form);
    const submitBtn = form.querySelector('.btn-submit');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = 'Sending...';
    submitBtn.disabled = true;

    fetch('send_brief.php', {
        method: 'POST',
        body: formData
    })
        .then(async response => {
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                const errorMsg = data && data.message ? data.message : 'Network response was not ok';
                throw new Error(errorMsg);
            }
            return data;
        })
        .then(data => {
            if (data.status === 'success') {
                form.style.display = 'none';
                successState.style.display = 'block';
            } else {
                alert('Error: ' + data.message);
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Submission failed: ' + error.message + '\n\nIf you are running this locally without a PHP server, the email form will not work.');
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
});

// Auto-resize textareas
const tx = document.getElementsByTagName("textarea");
for (let i = 0; i < tx.length; i++) {
    tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight) + "px;overflow-y:hidden;");
    tx[i].addEventListener("input", OnInput, false);
}

function OnInput() {
    this.style.height = 0;
    this.style.height = (this.scrollHeight) + "px";
}
