--
-- PostgreSQL database dump
--

-- Dumped from database version 12.1 (Ubuntu 12.1-1.pgdg18.04+1)
-- Dumped by pg_dump version 12.1 (Ubuntu 12.1-1.pgdg18.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    email character varying(20),
    password character varying(60),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin OWNER TO root;

--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO root;

--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- Name: articles; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.articles (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    title character varying(30) NOT NULL,
    body text NOT NULL,
    category text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.articles OWNER TO root;

--
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.articles_id_seq OWNER TO root;

--
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    article_id integer NOT NULL,
    employee_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comment character varying(50) NOT NULL
);


ALTER TABLE public.comments OWNER TO root;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO root;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    email character varying(25) NOT NULL,
    password character varying(60) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name text DEFAULT USER NOT NULL
);


ALTER TABLE public.employees OWNER TO root;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employees_id_seq OWNER TO root;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: gif_comments; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.gif_comments (
    id integer NOT NULL,
    gif_id integer NOT NULL,
    employee_id integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gif_comments OWNER TO root;

--
-- Name: gif_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.gif_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gif_comments_id_seq OWNER TO root;

--
-- Name: gif_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.gif_comments_id_seq OWNED BY public.gif_comments.id;


--
-- Name: gifs; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.gifs (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    url text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gifs OWNER TO root;

--
-- Name: gifs_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.gifs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gifs_id_seq OWNER TO root;

--
-- Name: gifs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.gifs_id_seq OWNED BY public.gifs.id;


--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: gif_comments id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gif_comments ALTER COLUMN id SET DEFAULT nextval('public.gif_comments_id_seq'::regclass);


--
-- Name: gifs id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gifs ALTER COLUMN id SET DEFAULT nextval('public.gifs_id_seq'::regclass);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: gif_comments gif_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gif_comments
    ADD CONSTRAINT gif_comments_pkey PRIMARY KEY (id);


--
-- Name: gifs gifs_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gifs
    ADD CONSTRAINT gifs_pkey PRIMARY KEY (id);


--
-- Name: employees unique_email; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT unique_email UNIQUE (email);


--
-- Name: articles articles_employeeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_employeeid_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: comments comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: comments comments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: gif_comments gif_comments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gif_comments
    ADD CONSTRAINT gif_comments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: gif_comments gif_comments_gif_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gif_comments
    ADD CONSTRAINT gif_comments_gif_id_fkey FOREIGN KEY (gif_id) REFERENCES public.gifs(id);


--
-- Name: gifs gifs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.gifs
    ADD CONSTRAINT gifs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- PostgreSQL database dump complete
--

