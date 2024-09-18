import { Routes, Route } from "react-router-dom";
import SignIn from "views/auth/SignIn";

export default function Auth() {

  return (
    <div className="relative float-right h-full min-h-screen w-full bg-white dark:bg-navy-900 ">
      <main className="mx-auto min-h-screen">
        <div className="relative flex h-full items-center justify-center">
          <div className="flex w-full flex-col items-center justify-center bg-[#0b3f7f]">
            <Routes>
              <Route path={`/sign-in`} element={<SignIn />} />
            </Routes>
            {/* <Footer /> */}
          </div>
        </div>
      </main>
    </div>
  );
}
