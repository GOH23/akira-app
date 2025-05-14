import { Layout } from 'antd';
import './index.css'; // import css
import { BrowserRouter, Routes, Route, HashRouter } from 'react-router-dom';
import { createRoot } from "react-dom/client";
import MainPage from './Components/MainPage';
import { ThemeProvider } from "next-themes";
import { Content } from 'antd/es/layout/layout';
import HeaderLayout from './Components/Elements/Header';
import ScenePage from './Components/ScenePage';
import './Components/i18n'
import { I18nextProvider } from 'react-i18next';
import i18n from './Components/i18n';

  
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <HashRouter>
        <I18nextProvider i18n={i18n}>
            <ThemeProvider defaultTheme="purple" themes={["purple", "dark", "light"]} enableSystem={false}>
                <Layout className="overflow-x-hidden">
                    <HeaderLayout />
                    <Layout>
                        <Content >

                            <Routes>
                                <Route path="/" element={<MainPage />} />
                                <Route path="/scenes" element={<ScenePage />} />
                            </Routes>
                        </Content>
                    </Layout>
                </Layout>
            </ThemeProvider>
        </I18nextProvider>
    </HashRouter>
);