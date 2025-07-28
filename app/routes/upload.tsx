import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdfToImage";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const upload = () => {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { fs, auth, isLoading, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const form: HTMLFormElement | null = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;
    if(!file) return 
    handleAnalyze({companyName, jobTitle, jobDescription, file});
  };
  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };
  const handleAnalyze = async ({companyName, jobTitle, jobDescription, file}: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File | null;
  }) => {
    setProcessing(true);
    setStatus("Processing your resume...");
    const uploadFile = await fs.upload([file as File])
    if(!uploadFile) return setStatus("Failed to upload file. Please try again.")
      setStatus("Converting resume to image...");
      const imageToPdf = await convertPdfToImage(file as File);
      if(!imageToPdf.file) return setStatus("Failed to convert PDF to image.");
      setStatus("Analyzing resume...");
      const uploadedResume = await fs.upload([imageToPdf.file]);
    if(!uploadedResume) return setStatus("Failed to upload file. Please try again.")
    setStatus("Analyzing resume with AI...");
    const uuid = generateUUID(); 
    const response = {
        companyName,
        jobTitle,
        jobDescription,
        resumePath: uploadedResume.path,
        imagePath: uploadedResume.path,
        uuid,
        feedback: "",
    }
    await kv.set(`resume:${uuid}`, JSON.stringify(response));
    setStatus("Analyzing resume using AI...");
    const feedback = await ai.feedback(uploadedResume.path, prepareInstructions({jobTitle, jobDescription}));
    if(!feedback) return setStatus("Failed to analyze resume. Please try again.");
    const feedbackData = typeof feedback.message.content === "string" ? feedback.message.content : feedback.message.content[0].text;
    const cleanedString = feedbackData.replace(/\\"/g, '"').replace(/\\n/g, '').replace(/^"(.*)"$/, '$1');
    const parsedResponse = JSON.parse(cleanedString);
    response.feedback = parsedResponse;
    await kv.set(`resume:${uuid}`, JSON.stringify(response));
    setStatus("Resume analyzed successfully!");
    console.log(response, 'response');
    navigate(`/resume/${uuid}`);
  }
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>Calculated Results for you desired job</h1>
          {processing ? (
            <>
              <h2>{status}</h2>
              <img
                src="/images/resume-scan.gif"
                alt="Loading..."
                className="w-full"
              />
            </>
          ) : (
            <h2>Upload your resume for an ATS score review</h2>
          )}
          {!processing && (
            <form id="upload-form" onSubmit={handleSubmit}>
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  id="company-name"
                  name="company-name"
                  placeholder="Company Name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  id="job-title"
                  name="job-title"
                  placeholder="Job Title"
                  required
                />
              </div> 
               <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  id="job-description"
                  name="job-description"
                  placeholder="job-description"
                />
              </div>    
               <div className="form-div">
                <label htmlFor="job-description">Upload Resume</label>
               <FileUploader onFileSelect={handleFileSelect} />
              </div> 
                  <button className="primary-button">
                   Process Resume
                  </button>          
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
