async function testLogin(email, password) {
  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log(`=== Login Test for ${email} ===`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    // Print headers (especially Set-Cookie)
    const cookies = response.headers.get("set-cookie");
    console.log(`Set-Cookie: ${cookies}`);

    try {
      const data = await response.json();
      console.log("Body:", JSON.stringify(data, null, 2));
    } catch {
      console.log("Body (not JSON)");
    }
    console.log("\n");
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

async function run() {
  await testLogin("admin@gmail.com", "123456");
  await testLogin("player@gmail.com", "123456");
}

run();
