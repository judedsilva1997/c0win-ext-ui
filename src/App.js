import "./App.css";
import { useCallback, useEffect, useState } from "react";
import Beneficiaries from "./components/Beneficiaries/Beneficiaries";
import { Modal, Button } from "react-bootstrap";
import LocationSelector from "./components/LocationSelector/LocationSelector";
import AuthContextProvider from "./components/AuthContextProvder";
import Login from "./components/Login/Login";
import TermsOfUse from "./components/TermsOfUse/TermsOfUse";

function App() {
  const [authToken, setAuthToken] = useState(null);
  const [step, setStep] = useState(0);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [error, setError] = useState();
  const [isChromeExtension, setIsChromeExtension] = useState(false);

  const nextStep = useCallback((filtered) => {
    if (filtered.length > 0) {
      setStep(step + 1);
      setSelectedBeneficiaries(filtered);
    } else {
      setError("Select Atleast 1 Beneficiary");
    }
  });

  const steps = [<Beneficiaries nextStep={nextStep} />, <LocationSelector />];

  useEffect(() => {
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
      // Code running in a Chrome extension (content script, background page, etc.)
      setIsChromeExtension(true);
      window.chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        (tabs) => {
          window.chrome.scripting.executeScript({
            files: ["content.js"],
            target: { tabId: tabs[0].id },
          });
        }
      );
      window.chrome.runtime.onMessage.addListener(function (
        message,
        sender,
        sendResponse
      ) {
        if (message.data) {
          setAuthToken(message.data);
        }
      });
    }
  }, []);

  return (
    <div
      className="App"
      {...(isChromeExtension && { style: { width: "600px", height: "600px" } })}
    >
      <AuthContextProvider
        value={{
          auth: { authToken, setAuthToken },
          selectedBeneficiaries: {
            selectedBeneficiaries,
            setSelectedBeneficiaries,
          },
        }}
      >
        <h2 className="title">Cowin Booking Helper</h2>
        {authToken ? (
          steps[step]
        ) : (
          <>
            <h5>Instructions:</h5>
            <ul>
              {isChromeExtension && (
                <li>
                  Please login to cowin portal and then open this extension
                </li>
              )}
              <li>
                This extension will help you book the slots the moment they're
                available.
              </li>
              <li>
                Do not close/hide this extension until your slot is booked
              </li>
            </ul>
            {!isChromeExtension && <Login setStep={setStep} />}
          </>
        )}

        <Modal show={error} onHide={() => setError(null)}>
          <Modal.Header closeButton>
            <Modal.Title>An error occured</Modal.Title>
          </Modal.Header>
          <Modal.Body>{error}</Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setError(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </AuthContextProvider>
      <TermsOfUse />
    </div>
  );
}

export default App;
