import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Entry } from 'contentful';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import {
  IPageFields,
  IUniqueProductFields,
} from '../../@types/generated/contentful';
import {
  fetchBlogHome,
  fetchBlogPages,
  fetchLayout,
  fetchPage,
  fetchProductBySlug,
  fetchProductPages,
  fetchProducts,
} from '../../src/api/contentful';
import config from '../../src/config';
import SiteLayout from '../../src/layout/layout';
import Spinner from '../../src/layout/Spinner';
import Layout from '../../src/layout/type/Layout';
import Product from '../../src/product/Product';
import SEO from '../../src/seo/SEO';
import { REVALIDATE_INTERVAL } from '../../src/util/constants';
import { formatPrice } from '../../src/util/price';
import { getProductSlug } from '../../src/util/product';

const ProductPage = ({
  page,
  product,
  layout,
}: {
  page?: Entry<IPageFields>;
  product?: Entry<IUniqueProductFields>;
  layout: Layout;
}) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div style={{ margin: 'auto' }}>
        <Spinner />
      </div>
    );
  }

  if (page) {
    return (
      <>
        <SEO title={page?.fields.title} />
        <SiteLayout layout={layout} page={page}>
          {page.fields.content &&
            documentToReactComponents(page.fields.content)}
        </SiteLayout>
      </>
    );
  }

  if (!product) {
    return null;
  }

  const plainDescription = documentToPlainTextString(
    product.fields.description
  );
  return (
    <>
      <SEO
        title={product.fields.title}
        description={`${plainDescription} - Prix : ${formatPrice(
          product.fields.price,
          'EUR'
        )}`}
        image={
          (product.fields.images?.length &&
            product.fields.images[0].fields.file.url) ||
          undefined
        }
        jsonld={{
          '@type': 'Product',
          name: product.fields.title,
          image: product.fields.images?.map((image) => image.fields.file.url),
          description: plainDescription,
          sku: product.sys.id,
          brand: {
            '@type': 'Brand',
            name: 'Makramonde',
          },
          manufacturer: {
            name: 'Makramonde',
          },
          offers: {
            '@type': 'Offer',
            url: `${config.siteUrl}${router.asPath}`,
            priceCurrency: 'EUR',
            price: product.fields.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: 'https://schema.org/OnlineOnly',
            priceValidUntil: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ).toISOString(),
          },
        }}
      ></SEO>
      <SiteLayout layout={layout} product={product}>
        <Product product={product} />
      </SiteLayout>
    </>
  );
};

const getProductStaticPaths = async () => {
  const [{ productPages }, { products }] = await Promise.all([
    fetchProductPages(),
    fetchProducts(),
  ]);
  const slugs = productPages.map((page) => page.fields.slug);
  const productSlugs = products.map(getProductSlug);
  const paths = slugs.reduce<{ params: { slug: string; subSlug: string } }[]>(
    (paths, slug) =>
      paths.concat(
        productSlugs.map((product) => ({
          params: {
            slug,
            subSlug: product,
            type: 'product',
          },
        }))
      ),
    []
  );
  return paths;
};

const getBlogStaticPaths = async () => {
  const [blogHomePage, { blogPages }] = await Promise.all([
    fetchBlogHome(),
    fetchBlogPages(),
  ]);

  if (!blogHomePage) {
    return [];
  }

  const slug = blogHomePage.fields.slug;
  const blogs = blogPages.map((blogPage) => blogPage.fields.slug);
  return blogs.map((blog) => ({
    params: {
      slug,
      subSlug: blog,
      type: 'blog',
    },
  }));
};

export const getStaticPaths: GetStaticPaths = async () => {
  const productPaths = await getProductStaticPaths();
  const blogPaths = await getBlogStaticPaths();
  return {
    paths: productPaths.concat(blogPaths),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (params?.type === 'blog') {
  }

  const [{ product }, layout] = await Promise.all([
    fetchProductBySlug({ slug: params?.subSlug }),
    fetchLayout(),
  ]);

  if (product) {
    return {
      props: { product, layout },
      revalidate: REVALIDATE_INTERVAL,
    };
  }

  const { page } = await fetchPage({ slug: params?.subSlug });

  if (!page) {
    return {
      notFound: true,
      revalidate: REVALIDATE_INTERVAL,
    };
  }

  return {
    props: { page, layout },
    revalidate: REVALIDATE_INTERVAL,
  };
};

export default ProductPage;
