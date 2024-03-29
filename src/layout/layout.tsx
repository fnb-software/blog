import { QuestionCircleOutlined } from '@ant-design/icons';
import { Alert, Col, Layout, Row, Tooltip } from 'antd';
import { Entry } from 'contentful';
import React, { ReactNode } from 'react';
import {
  IPageFields,
  IUniqueProductFields,
} from '../../@types/generated/contentful';
import { CartProvider } from '../cart/CartContext';
import Arrows from '../product/Arrows';
import SiteHeader from './header/header';
import './layout.less';
import styles from './layout.module.less';
import SiteSider from './sider/sider';
import LayoutType from './type/Layout';

const { Header, Content, Footer, Sider } = Layout;

const PROMO_MESSAGE = '';

type Props = {
  page?: Entry<IPageFields>;
  product?: Entry<IUniqueProductFields>;
  pageTitle?: string;
  layout: LayoutType;
  children: ReactNode;
};

const SiteLayout = ({ children, layout, page, product, pageTitle }: Props) => {
  const DEFAULT_COL_PROPS = {
    xs: { span: 22, offset: 1 },
    sm: { span: 20, offset: 2 },
    md: { span: 16, offset: 4 },
    lg: { span: 14, offset: 5 },
    xl: { span: 12, offset: 6 },
    xxl: { span: 10, offset: 7 },
  };

  return (
    <CartProvider>
      <Layout hasSider className={'full-height'}>
        <Sider
          theme="light"
          breakpoint="md"
          collapsedWidth="0"
          className={styles.sider}
          trigger={null}
        >
          <SiteSider layout={layout} />
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <SiteHeader
              pageTitle={
                page?.fields.title || product?.fields.title || pageTitle || ''
              }
              layout={layout}
              product={product}
            />
          </Header>
          {PROMO_MESSAGE && (
            <Alert
              className={styles.alert}
              type="info"
              message={PROMO_MESSAGE}
              closable
            ></Alert>
          )}
          <Content className={styles.content}>
            <Row className={'full-height'}>
              <Col {...DEFAULT_COL_PROPS}>
                {children}
                {product && (
                  <div className={styles.arrows}>
                    <Arrows layout={layout} product={product} floating />
                  </div>
                )}
              </Col>
            </Row>
          </Content>
          <Footer className={styles.footer}>
            © FnB Software Consulting {new Date().getFullYear()}.{' '}
            <Tooltip title="No personal data is collected">
              <i>
                GDPR <QuestionCircleOutlined />
              </i>
            </Tooltip>
          </Footer>
        </Layout>
      </Layout>
    </CartProvider>
  );
};

export default SiteLayout;
