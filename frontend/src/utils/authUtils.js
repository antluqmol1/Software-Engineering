// Function to check if the user is logged in by verifying the presence of a token in the session storage
export const checkUserLoggedIn = () => {
    // Check if a token exists in the session storage
    const token = sessionStorage.getItem('authToken');

    console.log("TOKEN: ", token);
    
    // Return true if a token exists, indicating that the user is logged in
    // Otherwise, return false
    return !!token;
  };
  