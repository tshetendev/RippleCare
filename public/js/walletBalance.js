// Function to fetch wallet balance and update navigation bar
async function fetchWalletBalance() {
    try {
        const response = await fetch('/wallet-balance');
        const data = await response.json();

        if (data.success) {
            const walletBalanceElement = document.getElementById('walletBalance');
            walletBalanceElement.textContent = `Wallet Balance: ${data.balance} XRP`;
        } else {
            console.error('Failed to fetch wallet balance:', data.error);
            // Optionally handle error case here
        }
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        // Optionally handle error case here
    }
}

// Call the function to fetch wallet balance when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchWalletBalance();
});