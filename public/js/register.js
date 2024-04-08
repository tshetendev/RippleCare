document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        walletAddress: formData.get('walletAddress'),
        walletSecret: formData.get('walletSecret')
    };

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            // Registration successful, redirect to login page
            alert('User registered successfully');
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            const result = await response.text();
            alert(result);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error registering user');
    }
});
