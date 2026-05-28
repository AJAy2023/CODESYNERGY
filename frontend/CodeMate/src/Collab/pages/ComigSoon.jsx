// import React from "react";
// import { Link } from "react-router-dom";
// import { Hammer, Rocket } from "lucide-react";

// const ComingSoon = () => {
//   return (
//     <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050B16] px-6">
      
//       {/* Glow Background */}
//       <div className="absolute inset-0">
//         <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
//         <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
//       </div>

//       {/* Card */}
//       <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        
//         {/* Icon */}
//         <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
//           <Rocket size={38} />
//         </div>

//         {/* Heading */}
//         <h1 className="mt-8 text-4xl font-extrabold text-white">
//           BuddyCode is evolving 🚀
//         </h1>

//         {/* Message */}
//         <p className="mt-5 text-lg leading-8 text-slate-300">
//           We're currently working on exciting features like
//           authentication, coding battles, AI assistance,
//           collaborative rooms, and much more.
//         </p>

//         <p className="mt-4 text-slate-400">
//           The platform will be live very soon ✨
//         </p>

//         {/* Status */}
//         <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-300">
//           <Hammer size={18} />
//           Working on features...
//         </div>

//         {/* Back Button */}
//         <div className="mt-10">
//           <Link
//             to="/"
//             className="inline-flex items-center rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:bg-cyan-400"
//           >
//             Back to Home
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComingSoon;




import React from "react";
import { Link } from "react-router-dom";
import { Rocket, Hammer } from "lucide-react";

const ComingSoon = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050B16] px-6">
      
      {/* Glow Effects */}
      <div className="absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
          <Rocket size={38} />
        </div>

        {/* Heading */}
        <h1 className="mt-8 text-4xl font-extrabold text-white">
          BuddyCode is evolving 
        </h1>

        {/* Description */}
        <p className="mt-5 text-lg leading-8 text-slate-300">
        We're working hard to bring you live coding battles,
        collaborative rooms, AI coding assistance,
        and an even bigger developer experience.
        </p>

        <p className="mt-4 text-slate-400">
          The platform will be live very soon...!! 
        </p>

        {/* Status Badge */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-300">
          <Hammer size={18} />
          Working on features...
        </div>

        {/* Back Button */}
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black transition hover:bg-cyan-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

