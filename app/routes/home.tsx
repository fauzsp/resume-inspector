import {  useEffect } from "react";
import ResumeCard from "~/components/ResumeCard";
import { resumes } from "../../constants";
import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resume Inspector" },
    { name: "description", content: "Smart resume analyzer" },
  ];
}

export default function Home() {
    const {auth} = usePuterStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth?next=/');
    } 
  }, [auth.isAuthenticated]);
  return (<main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />
    <section className="main-section">
      <div className="page-heading py-16">
      <h1>Welcome to Resume Inspector</h1>
      <h2>Your smart resume analyzer</h2>
      </div>
{resumes.length > 0 &&
<div className="resumes-section">
    {resumes.map((resume) => {
     return <ResumeCard key={resume.id} resume={resume} />
    })}
    </div>
  }
    </section>
    </main>
  )
}
