const axios = 110;
for (let i = 0; i < axios; i++) {
    fetch('http://localhost:3000/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
        , body: JSON.stringify({
            email: "superadmin@uptamca.ve",
            password: "Hoola12."
        })
    }).then(res => res.json()).then(json => console.log(json)).then(() => {
        console.log(`Request ${i + 1} completed`);
    }).catch(err => console.error(`Request ${i + 1} failed:`, err));
}