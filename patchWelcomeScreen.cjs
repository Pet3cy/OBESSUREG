const fs = require('fs');
const file = 'components/WelcomeScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Layout, Calendar, Brain, Shield, ArrowRight } from 'lucide-react';",
  "import { Layout, Calendar, Brain, Shield, ArrowRight, Loader2 } from 'lucide-react';"
);

content = content.replace(
  "interface WelcomeScreenProps {\n  onGetStarted: () => void;\n}",
  "interface WelcomeScreenProps {\n  onLogin: () => void;\n  isLoggingIn?: boolean;\n}"
);

content = content.replace(
  "export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {",
  "export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, isLoggingIn }) => {"
);

content = content.replace(
  /onClick=\{onGetStarted\}[\s\S]*?Enter Workspace[\s\S]*?<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" \/>/g,
  `onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full bg-brand-policy text-white text-lg font-bold py-4 px-8 rounded-xl hover:bg-brand-policy transition-all shadow-lg shadow-brand-policy/30 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoggingIn ? (
                 <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                 <>Sign in with Google <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}`
);

fs.writeFileSync(file, content);
