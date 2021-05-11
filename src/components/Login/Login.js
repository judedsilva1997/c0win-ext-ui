import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import AuthContext from "../../context/AuthContext";
import urls from "../../config";
import { SHA256 } from "crypto-js";
export default function Login(props) {
  const { auth, selectedBeneficiaries } = useContext(AuthContext);
  const [mobile, setMobile] = useState("");
  const [txnId, setTxnId] = useState(false);
  const [otp, setOTP] = useState("");
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    selectedBeneficiaries.setSelectedBeneficiaries([]);
    props.setStep(0);
  }, []);
  async function generateOTP() {
    setDisabled(true);
    if (mobile.match("[0-9]{10}")) {
      try {
        const response = await axios.post(urls.GENERATE_OTP, {
          mobile,
        });
        setTxnId(response.data.txnId);
      } catch (err) {}
    }
    setDisabled(false);
  }
  async function validateOTP() {
    setDisabled(true);
    if (otp.match("[0-9]{6}")) {
      try {
        const response = await axios.post(urls.LOGIN, {
          txnId,
          otp: SHA256(otp).toString(),
        });
        if (response.data.token) {
          setDisabled(false);
          auth.setAuthToken(response.data.token);
        } else {
          setDisabled(false);
        }
      } catch (err) {
        console.log(err);
        setDisabled(false);
      }
    }
  }

  return (
    <>
      {!txnId ? (
        <>
          <h1>Login</h1>
          <Form.Group>
            <Form.Label>Enter Phone Number</Form.Label>
            <Form.Control
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter phone number"
            />
            <Form.Text className="text-muted">
              We'll never share your number with anyone else.
            </Form.Text>
          </Form.Group>
          <Button
            variant="primary"
            disabled={disabled}
            type="submit"
            onClick={generateOTP}
          >
            GET OTP
          </Button>
        </>
      ) : (
        <>
          <Form.Group controlId="formBasicPassword">
            <Form.Label>Enter OTP</Form.Label>
            <Form.Control
              type="password"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
              placeholder="Password"
            />
          </Form.Group>

          <Button
            variant="primary"
            disabled={disabled || !otp}
            type="submit"
            onClick={validateOTP}
          >
            Login
          </Button>
        </>
      )}
    </>
  );
}
