async function fetchCampaigns() {
    try {
        const campaignList = document.getElementById('campaignList');
        campaignList.innerHTML = '<p>Loading campaigns...</p>'; // Show loading message

        const response = await fetch('/campaigns'); // Fetch all campaigns
        const campaigns = await response.json();

        if (campaigns.length === 0) {
            campaignList.innerHTML = '<p>No campaigns available.</p>'; // Show message if no campaigns
        } else {
            campaignList.innerHTML = ''; // Clear loading message
            // Reverse the order of campaigns to display the latest ones at the top
            campaigns.reverse().forEach(async (campaign) => {
                const campaignDiv = document.createElement('div');
                const reader = new FileReader();

                reader.onload = async function (event) {
                    const imageDataUrl = event.target.result;

                    campaignDiv.innerHTML = `
                        <div class="campaign-card">
                            <h3>${campaign.title}</h3>
                            <h4><b>Campaign ID:</b> </br>${campaign.campaignId}</h4>
                            <img src="${imageDataUrl}" alt="Campaign Image" width="350" height="200">
                            <p><b>Description:</b> </br>${campaign.description}</p>
                            <p><b>Target Amount:</b> </br>${campaign.targetAmount}</p>
                            <p><b>Creator Wallet Address:</b> </br>${campaign.creatorWalletAddress}</p>
                            <p><b>Status:</b> </br>${campaign.status}</p>
                            <div id="raisedAmount_${campaign.campaignId}">Raised Amount: Loading...</div>
                            <button class="view-transactions-btn" data-campaign-id="${campaign.campaignId}">View Transactions</button>
                        </div>
                    `;
                    campaignList.appendChild(campaignDiv);

                    // Attach event listener for viewing transactions
                    const viewTransactionsBtn = campaignDiv.querySelector('.view-transactions-btn');
                    viewTransactionsBtn.addEventListener('click', () => {
                        const campaignId = viewTransactionsBtn.dataset.campaignId;
                        fetchCampaignTransactions(campaignId);
                    });

                    // Fetch raised amount for the campaign
                    try {
                        const raisedAmountDiv = campaignDiv.querySelector(`#raisedAmount_${campaign.campaignId}`);
                        const raisedAmountResponse = await fetch(`/campaigns/${campaign.campaignId}/raised`);
                        const raisedAmountData = await raisedAmountResponse.json();
                        raisedAmountDiv.textContent = `Raised Amount: ${raisedAmountData.totalRaised}`;
                    } catch (error) {
                        console.error('Error fetching raised amount for campaign:', error);
                    }
                };

                // Convert the ArrayBuffer to Blob
                const blob = new Blob([new Uint8Array(campaign.image.data)], { type: 'image/jpeg' });

                // Read the Blob as a data URL
                reader.readAsDataURL(blob);
            });
        }
    } catch (error) {
        console.error('Error fetching active campaigns:', error);
        const campaignList = document.getElementById('campaignList');
        campaignList.innerHTML = '<p>Error loading campaigns. Please try again later.</p>'; // Show error message
    }
}

// Fetch campaigns when the page loads
window.onload = async () => {
    await fetchCampaigns();
};


function openOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.style.display = 'block';
}

// Function to close overlay
function closeOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.style.display = 'none';
}

async function fetchCampaignTransactions(campaignId) {
    try {
        const response = await fetch(`/campaigns/${campaignId}/transactions`);
        const transactions = await response.json();
        const transactionList = document.getElementById('transactionList');
        transactionList.innerHTML = '';

        if (transactions.length === 0) {
            const noTransactionsMessage = document.createElement('p');
            noTransactionsMessage.textContent = 'No transactions available.';
            transactionList.appendChild(noTransactionsMessage);
        } else {
            // Reverse the order of transactions to display the latest ones at the top
            transactions.reverse().forEach(transaction => {
                const transactionDiv = document.createElement('div');
                transactionDiv.innerHTML = `
                    <p>Transaction ID: ${transaction.transactionId}</p>
                    <p>Sender: ${transaction.sender}</p>
                    <p>Receiver: ${transaction.receiver}</p>
                    <p>Amount: ${transaction.amount}</p>
                    <hr>
                `;
                transactionList.appendChild(transactionDiv);
            });
        }

        openOverlay('transactionOverlay'); // Show the overlay
    } catch (error) {
        console.error('Error fetching campaign transactions:', error);
    }
}


// Fetch campaigns when the page loads
window.onload = async () => {
    await fetchCampaigns();
};
