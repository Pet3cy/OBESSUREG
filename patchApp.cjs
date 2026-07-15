const fs = require('fs');
const file = 'App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace !hasStarted with needsAuth
content = content.replace(
  /if \(!hasStarted\) \{\n    return <WelcomeScreen onGetStarted=\{[^}]+\} \/>;\n  \}/g,
  `if (needsAuth) {
    return <WelcomeScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
  }`
);

fs.writeFileSync(file, content);
