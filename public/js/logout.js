document.addEventListener('DOMContentLoaded', function () {
    const logoutForm = document.getElementById('logoutForm');
    logoutForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        try {
            const response = await fetch('/logout', {
                method: 'POST'
            });

            if (response.ok) {
                // Logout successful
                alert('Logged out successfully');
                // Redirect to another page
                window.location.href = 'index.html'; // Replace 'logout.html' with the desired URL
            } else {
                // Logout failed
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            alert('An error occurred while logging out. Please try again later.');
        }
    });
});