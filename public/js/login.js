document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            // Login successful, redirect to index page
            alert('Login successful');
            window.location.href = 'index1.html'; // Redirect to index page
        } else {
            const result = await response.text();
            alert(result);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error logging in');
    }
});
