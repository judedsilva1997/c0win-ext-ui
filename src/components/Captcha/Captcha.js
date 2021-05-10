import { useContext, useEffect, useState } from "react";
import urls from "../../config";
import { Form } from "react-bootstrap";
import axios from "axios";
import AuthContext from "../../context/AuthContext";
export default function Captcha({ setCaptcha }) {
  const [captchaImage, setCaptchaImage] = useState();
  const { auth, selectedBeneficiaries } = useContext(AuthContext);
  useEffect(async () => {
    try {
      const response = await axios.post(
        urls.CAPTCHA,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.authToken}`,
          },
        }
      );
      if (response.data && response.data.captcha) {
        setCaptchaImage(response.data.captcha);
      }
    } catch (err) {}
  }, []);
  return (
    <div className="captcha">
      <div
        className="image"
        dangerouslySetInnerHTML={{
          __html: captchaImage,
        }}
      ></div>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Enter the above captcha</Form.Label>
        <Form.Control
          type="email"
          placeholder=""
          onChange={(e) => {
            setCaptcha(e.target.value);
          }}
        />
      </Form.Group>
    </div>
  );
}
