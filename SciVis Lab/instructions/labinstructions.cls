%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Lab instructions class
% 
% (c)2003-2006 Karljohan Lundin
% (c)1999-2000 Patric Ljung
% 
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Available commands:
% 
% \course{courseid/name}
% 
% \laboration{laborationid/name}
% 
% \code{code/function/variable}
% 
% \codeinput{file}
% 
% \important{the important thing}
% 
% \tip{the tip}
% 
% \note{the note}
% 
% 
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Available environments:
% 
% \begin{task} or \begin{task}[task name]
% (an unnamed or named task)
%
% \begin{extratask} or \begin{extratask}[task name]
% (an unnamed or named extra task)
% 
% \begin{codelist}
% (a list of code, for example a program)

\NeedsTeXFormat{LaTeX2e}[1995/12/01]
\ProvidesClass{labinstructions}[2006/09/01 Document class for lab instructions]
\LoadClass[a4paper,11pt,twoside, titlepage]{article}
\RequirePackage[a4paper, inner=3cm, outer=2cm, top=2.5cm, bottom=2.5cm, pdftex]{geometry}
\raggedbottom

\NeedsTeXFormat{LaTeX2e}

\RequirePackage{type1cm}
\RequirePackage{ifthen}
\RequirePackage{fancyhdr}


\RequirePackage{verbatim}

\RequirePackage{float}

\RequirePackage[T1]{fontenc}
\RequirePackage[latin1]{inputenc}


\RequirePackage[pdftex]{graphicx}

\RequirePackage{color}
\definecolor{colorBlack}{rgb}{0,0,.2}
\RequirePackage[pdftex,%
 colorlinks=true,
 urlcolor=colorBlack,       % \href{...}{...} external (URL)
 filecolor=colorBlack,     % \href{...} local file
 linkcolor=colorBlack,       % \ref{...} and \pageref{...}
 citecolor=colorBlack,
 plainpages=false,
 pagebackref,
 pdfpagemode=None,
 bookmarksopen=true]{hyperref}

\AtBeginDocument{%
  \title{\@course \\ \@laboration}
  \hypersetup{%
    pdftitle={\@laboration},%
    pdfauthor={},%
    pdfsubject={\@course},%
    pdfkeywords={}}}

\definecolor{gray}{cmyk}{.0,.0,.0,.6}
\definecolor{lightgray}{cmyk}{.0,.0,.0,.1}
\definecolor{taskcolor}{cmyk}{.0,.0,.0,.2}

\definecolor{taskframecolor}{cmyk}{.0,.0,.0,.0}
\definecolor{taskbgcolor}{cmyk}{.3,.02,.14,.0}
\definecolor{extrataskframecolor}{cmyk}{0,0,0,.0}
\definecolor{extrataskbgcolor}{cmyk}{.14,.0,.40,.0}


\def\@course{}
\newcommand{\course}[1]{\def\@course{#1}}

\def\@laboration{}
\newcommand{\laboration}[1]{\def\@laboration{#1}}

\newcounter{taskcounter}
\newcounter{extrataskcounter}
\newsavebox{\@tasktext}

\newenvironment{task}[1][]%
{\addtocounter{taskcounter}{1}%
\begin{lrbox}{\@tasktext}\begin{minipage}{\linewidth}
    \noindent{\bf \emph{Task \arabic{taskcounter}\ifthenelse{\equal{#1}{}}{:}{ --- #1:}}}\par}%
{\par\end{minipage}\end{lrbox}\par\vspace{.15in}
  \noindent\fcolorbox{taskframecolor}{taskbgcolor}{\usebox{\@tasktext}}
  \vspace{.1in}\par}

  \newenvironment{extratask}[1][]%
{\addtocounter{extrataskcounter}{1}%
\begin{lrbox}{\@tasktext}\begin{minipage}{\linewidth}
    \noindent{\bf {* \emph{Extrauppgift \arabic{extrataskcounter}\ifthenelse{\equal{#1}{}}{:}{ --- #1:}}}}\par}%
{\par\end{minipage}\end{lrbox}\par\vspace{.15in}
  \noindent\fcolorbox{extrataskframecolor}{extrataskbgcolor}{\usebox{\@tasktext}}
  \vspace{.1in}\par}

%\newenvironment{task}[1][]%
%{\par\vspace{.2in}
%  \noindent\begin{minipage}{\linewidth}
%    \rule[.5em]{\linewidth}{.1pt}\addtocounter{taskcounter}{1}
%    \noindent{\bf Task \arabic{taskcounter}\ifthenelse{\equal{#1}{}}{:}{ --- #1:}}\par}%
%{\par\noindent\rule[-.5em]{\linewidth}{.1pt}\end{minipage}
%  \vspace{.2in}\par}

\newcommand{\important}[1]{\emph{Important: }#1}

\newcommand{\tip}[1]{\emph{Tip: }#1}

\newcommand{\note}[1]{[Note: #1]}

\newcommand{\code}[1]{\texttt{\hyphenchar\font45\relax #1}}

\newenvironment{codelist}{\footnotesize\verbatim}{\endverbatim\normalsize}

\newcommand{\codeinput}[1]{\footnotesize\verbatiminput{#1}\normalsize}

\ProcessOptions 

%\headwidth 170mm
\headheight 14pt
\lhead{\@course}
\chead{}
\rhead{\@laboration}
\lfoot{}
\cfoot{\thepage}
\rfoot{}
