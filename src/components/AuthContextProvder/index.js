import AuthContext from "../../context/AuthContext";

export default function AuthContextProvider(props) {
  return (
    <AuthContext.Provider value={props.value}>
      {props.children}
    </AuthContext.Provider>
  );
}
