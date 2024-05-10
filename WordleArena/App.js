import RootNavigation from "@/navigation/root-navigation";

import { Provider } from "react-redux";
import { store } from "@/redux/store";

const App = () => {
  return (
    <Provider store={store}>
      <RootNavigation />
    </Provider>
  );
}

export default App;