
import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto py-8 px-4 border-t border-white/5">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-radium font-bold text-lg mb-4">AI Interview Assistant</h3>
            <p className="text-white/60 text-sm">
              Master your technical interviews with our advanced AI-powered interview simulator.
              Practice coding, OOP, behavioral, and system design interviews.
            </p>
          </div>
          
          <div>
            <h4 className="text-radium font-bold mb-4">Interview Types</h4>
            <ul className="space-y-2 text-white/60">
              <li className="transition-colors hover:text-radium">Coding (45min)</li>
              <li className="transition-colors hover:text-radium">Object-Oriented (30min)</li>
              <li className="transition-colors hover:text-radium">Behavioral (30min)</li>
              <li className="transition-colors hover:text-radium">System Design (30min)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-radium font-bold mb-4">Connect</h4>
            <div className="flex gap-4 mb-4">
              <a href="#" className="text-white/60 hover:text-radium transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-white/60 hover:text-radium transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white/60 hover:text-radium transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} AI Interview Assistant. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
