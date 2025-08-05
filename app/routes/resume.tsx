import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Ats from "~/components/Ats";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = () => ([
  { title: "Resume Inspector - Review" },
  { name: "description", content: "Review your resume with AI assistance" },
])

const Resume = () => {
  const { fs, auth, isLoading, kv } = usePuterStore();
  const { id } = useParams<{ id: string }>();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();
    const loadResume = async () => { 
        const response = await kv.get(`resume:${id}`);
        if(!response) return
        const data = JSON.parse(response);
        const resumeBlob = await fs.read(data.resumePath);
        if(!resumeBlob) return;
        const pdfUrl = new Blob([resumeBlob], { type: 'application/pdf' });
        const resumeUrl = URL.createObjectURL(pdfUrl);
        setResumeUrl(resumeUrl);
        const imgBlob = await fs.read(data.imagePath);
        if(!imgBlob) return;
        const imgUrl = URL.createObjectURL(new Blob([imgBlob], { type: 'image/jpeg' }));
        setImgUrl(imgUrl);
        const feedbackJson = {feedback: JSON.parse(data.feedback.slice(data.feedback.indexOf("{")))};
        setFeedback(feedbackJson || "No feedback available.");
    };
      useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/resume/' + id);
    } 
  }, [isLoading]);
  useEffect(() => {
    loadResume();
  }, [id]);
  return (
    <main className="!pt-0">
    <nav className="resume-nav">
        <Link to="/" className="back-button">
            <img className="w-2.5 h-2.5" src="/icons/back.svg" alt="Back" />
            <span className="text-gray-100 text-sm font-semibold">Back to Home</span>
        </Link>
    </nav>
    <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
            {imgUrl && resumeUrl && (
            <div className=" animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-sm:h-[400px] max-wxl:h-fit w-fit">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full">
                    <img title='resume' className="w-full h-full object-contain rounded-2xl" src={imgUrl} />
                </a>
                </div>
                )}
        </section>
        <section className="feedback-section">
            <h2 className="text-4xl !text-black font-bold">Resume Analysis</h2>
            {feedback ? <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
            <Summary feedback={feedback} />
            <Ats feedback={feedback} />
            <Details feedback={feedback} />
            </div> : <img src="/images/resume-scan-2.gif" alt="Loading..." className="w-full" />}
        </section>
    </div>
    </main>
  )
}

export default Resume