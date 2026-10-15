%
% This is the class for PJATK thesis
%
% Tadeusz Puźniakowski 2023
% Ian Canals-Wąsik (title page draft)
%
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{sprz}[2023/10/27 SPRZ]
\LoadClass[12pt,a4paper]{report}
\renewcommand{\baselinestretch}{1.3} 
\RequirePackage[a4paper, margin=2.5cm]{geometry}
\RequirePackage{listings} %Aby dało się umieszczać kody źródłowe programów
\RequirePackage[table]{xcolor}
\RequirePackage{algorithmic} %Aby dało się umieszczać algorytmy
\RequirePackage[T1]{fontenc}
\RequirePackage[utf8]{inputenc}
\RequirePackage{mathptmx} % Times New Roman
\RequirePackage{polski} % Włączenie obsługi polskich liter
\RequirePackage{tabularx}
\RequirePackage{url}
\RequirePackage{graphicx}
\RequirePackage[pscoord]{eso-pic}% The zero point of the coordinate systemis the lower left corner of the page (the default).
\RequirePackage{multirow}
\RequirePackage{graphicx}
\RequirePackage[backend=biber,style=numeric,sorting=none]{biblatex}

\DeclareFieldFormat[article,inbook,incollection,inproceedings,patent,thesis,
   unpublished,techreport,misc,book]{title}{,,#1''}
% {title}{\mkbibquote{#1}}

\newcommand{\@nabstract}{\@latex@error{No \noexpand\@nabstract given}\@ehc}
\newcommand{\nabstract}[1]{\renewcommand{\@nabstract}{#1}}

\newcommand{\@studfield}{\@latex@error{No \noexpand\@studfield given}\@ehc}
\newcommand{\studfield}[1]{\renewcommand{\@studfield}{#1}}

\newcommand{\@studtype}{\@latex@error{No \noexpand\@studtype given}\@ehc}
\newcommand{\studtype}[1]{\renewcommand{\@studtype}{#1}}


\newcommand{\@engtitle}{\@latex@error{No \noexpand\@engtitle given}\@ehc}
\newcommand{\engtitle}[1]{\renewcommand{\@engtitle}{#1}}

\newcommand{\@acronym}{\@latex@error{No \noexpand\@acronym given}\@ehc}
\newcommand{\acronym}[1]{\renewcommand{\@acronym}{#1}}

\newcommand{\@titledate}{\@latex@error{No \noexpand\@titledate given}\@ehc}
\newcommand{\titledate}[1]{\renewcommand{\@titledate}{#1}}

\newcommand{\@reviewer}{\@latex@error{No \noexpand\@reviewer given}\@ehc}
\newcommand{\reviewer}[1]{\renewcommand{\@reviewer}{#1}}


\newcommand{\@finishdate}{\@latex@error{No \noexpand\@finishdate given}\@ehc}
\newcommand{\finishdate}[1]{\renewcommand{\@finishdate}{#1}}




\newcommand{\@productsandservices}{\@latex@error{No \noexpand\@productsandservices given}\@ehc}
\newcommand{\productsandservices}[1]{\renewcommand{\@productsandservices}{#1}}


\newcommand{\@mainfunctionalities}{\@latex@error{No \noexpand\@mainfunctionalities given}\@ehc}
\newcommand{\mainfunctionalities}[1]{\renewcommand{\@mainfunctionalities}{#1}}



\newcommand{\@supervisor}{\@latex@error{No \noexpand\@supervisor given}\@ehc}
\newcommand{\supervisor}[1]{\renewcommand{\@supervisor}{#1}}

\newcommand{\@projectgoals}{\@latex@error{No \noexpand\@projectgoals given}\@ehc}
\newcommand{\projectgoals}[1]{\renewcommand{\@projectgoals}{#1}}

\newcommand{\@successmeasure}{\@latex@error{No \noexpand\@successmeasure given}\@ehc}
\newcommand{\successmeasure}[1]{\renewcommand{\@successmeasure}{#1}}

\newcommand{\@projlimitations}{\@latex@error{No \noexpand\@projlimitations given}\@ehc}
\newcommand{\projlimitations}[1]{\renewcommand{\@projlimitations}{#1}}




\newlength{\@authorsep}
\setlength{\@authorsep}{1.2em}
\newlength{\@bottomsep}
\setlength{\@bottomsep}{0.8em}
\newlength{\@midsep}
\setlength{\@midsep}{1em}
\newcounter{@authorcount}
\setcounter{@authorcount}{0}

\newcommand{\@authors}{}
\newcommand{\@authorstp}{}
\newcommand{\@authorstablerows}{}
\newcommand{\@authorattachment}{}
\newcommand{\@declarationpages}{}

\renewcommand{\author}[4]{%
	\stepcounter{@authorcount}
	\expandafter\g@addto@macro\expandafter\@authors\expandafter{#1 & #2 \\ \hline}
	\expandafter\g@addto@macro\expandafter\@authorstp\expandafter{\textbf{#1} \\ Nr albumu #2 \\ Nazwa specjalizacji: #3 \\[\@authorsep]}
	\expandafter\g@addto@macro\expandafter\@authorstablerows\expandafter{#1 & #2 & #3 & #4 \\ \hline}
	\expandafter\g@addto@macro\expandafter\@authorattachment\expandafter{#1\_}
	\expandafter\g@addto@macro\expandafter\@declarationpages\expandafter{\@makedeclarationaipage{#1}{#2}{#3}}
}

\newcommand{\@makedeclarationaipage}[3]{%
	% #1=imię i nazwisko, #2=nr albumu, #3=kierunek
	\thispagestyle{empty}%
	\noindent\makebox[7cm]{\dotfill}\\[0.3em]
	{\small (data, miejscowość)}
	\vspace{2em}
	\begin{center}
		\large\textbf{OŚWIADCZENIE STUDENTA}\\[0.3em]
		\large\textbf{DOTYCZĄCE WYKORZYSTANIA SZTUCZNEJ INTELIGENCJI (AI)}
	\end{center}
	\vspace{2em}
	\noindent Ja, niżej podpisany/a:\enspace\textbf{#1}
	\vspace{1.5em}

	\noindent student/ka kierunku:\enspace\textbf{#3}
	\vspace{1.5em}

	\noindent numer albumu studenta:\enspace\textbf{#2}
	\vspace{2em}

	\noindent Oświadczam, że zapoznałem/am się z treścią Zarządzenia Rektora Polsko-Japońskiej
	Akademii Technik Komputerowych z dnia 1 kwietnia 2026~r. oraz z ,,Wytycznymi dotyczącymi
	wykorzystywania sztucznej inteligencji w procesie dydaktycznym PJATK'', stanowiącymi
	załącznik do ww.\ zarządzenia.

	\vspace{1em}
	\noindent Oświadczam, że ewentualne wykorzystanie narzędzi sztucznej inteligencji (AI)
	w niniejszej pracy miało charakter wyłącznie pomocniczy i nie stanowiło zastępstwa dla
	mojej samodzielnej pracy.

	\vspace{1em}
	\noindent Oświadczam, że treść pracy stanowi moje własne, samodzielne opracowanie oraz
	ponoszę pełną odpowiedzialność za jej zawartość, niezależnie od wykorzystania narzędzi AI.

	\vspace{1em}
	\noindent Oświadczam, że nie wykorzystywałem/am narzędzi AI do generowania treści
	stanowiących zasadniczą część pracy, w szczególności analiz, wniosków, interpretacji
	ani części podlegających ocenie jako przejaw twórczości własnej.

	\vspace{1em}
	\noindent W przypadku korzystania z narzędzi AI sporządziłem/am Raport użycia AI zgodnie
	z obowiązującymi Wytycznymi i dołączyłem/am go do pracy.

	\vfill
	\noindent\makebox[8cm]{\dotfill}\\[0.3em]
	{\small (czytelny podpis studenta/studentki)}
	\newpage
	\thispagestyle{empty}\mbox{}\newpage
}

\newcommand{\makedeclarationsai}{\@declarationpages}

\newcommand{\@consultants}{}
\newcommand{\consultant}[1]{%
	\expandafter\g@addto@macro\expandafter\@consultants\expandafter{\item #1
	}
}

\newcommand{\@nkeywords}{}
\newcommand{\@nkeywordscoma}{}
\newcommand{\keyword}[1]{%
	\expandafter\g@addto@macro\expandafter\@nkeywords\expandafter{\@nkeywordscoma#1}
	\renewcommand{\@nkeywordscoma}{, }
}




\newcommand{\putimage}[4]{%
	\begin{figure}[h!]
		\label{#3}
		\centering
		\includegraphics[width={#4}]{#2}
		\caption{#1}
	\end{figure}
}



\define@key{pjatk}{label}{\def\tablabel{#1}}
\define@key{pjatk}{caption}{\def\tabcaption{#1}}

% Define the new environment 'stakeholder' and custom commands for stakeholders' information
\newenvironment{stakeholder}[1][]{%
	\setkeys{pjatk}{#1}% Setting default key values
	\newcommand{\id}[1]{Identyfikator: & ##1 \\ \hline}
	\newcommand{\name}[1]{Nazwa: & ##1 \\ \hline}
	\newcommand{\descr}[1]{Opis: & ##1 \\ \hline}
	\newcommand{\type}[1]{Typ udziałowca: & ##1 \\ \hline}
	\newcommand{\viewpoint}[1]{Punkt widzenia: & ##1 \\ \hline}
	\newcommand{\limitations}[1]{Ograniczenia: & ##1 \\ \hline}
	\newcommand{\requ}[1]{Wymagania: & ##1 \\ \hline}
	\table[h!]
	\centering
	\begin{tabular}{|>{\columncolor{lightgray}}c|p{0.6\linewidth}|}
		\hline
		\rowcolor{lightgray}\multicolumn{2}{|c|}{\textbf{KARTA UDZIAŁOWCA}} \\
		\hline
		}{%
	\end{tabular}
	\caption{\tabcaption}
	\label{\tablabel}
	\endtable
}


% Define the new environment 'stakeholder' and custom commands for stakeholders' information
\newenvironment{requirementstab}[1][]{%
\setkeys{pjatk}{#1}% Setting default key values
\newcommand{\id}[1]{Identyfikator: & ##1 & }
\newcommand{\priority}[1]{Priorytet: & ##1 \\ \hline}
\newcommand{\name}[1]{Nazwa: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\descr}[1]{Opis: & \multicolumn{3}{|p{0.6\linewidth}|}{\parbox{0.99\linewidth}{##1}}  \\ \hline}
\newcommand{\acceptcrit}[1]{Kryteria akceptacji: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\inputdata}[1]{Dane wejściowe: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\preconditions}[1]{Warunki początkowe: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\postconditions}[1]{Warunki końcowe: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\exceptions}[1]{Sytuacje wyjątkowe: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\implementation}[1]{Szczegóły implementacji: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\sholder}[1]{Udziałowiec: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\newcommand{\reqrelated}[1]{Wymagania powiązane: & \multicolumn{3}{|p{0.6\linewidth}|}{##1}  \\ \hline}
\table[h!]
\centering
\begin{tabular}{|>{\columncolor{lightgray}}l|l|>{\columncolor{lightgray}}l|p{0.1\linewidth}|}
	\hline
	\rowcolor{lightgray}\multicolumn{4}{|c|}{\textbf{KARTA WYMAGANIA}} \\
	\hline
	}{%
\end{tabular}
\caption{\tabcaption}
\label{\tablabel}
\endtable
}





\newcommand{\generalrequirement}[7]{
	\begin{table}[h!]
		\centering
		\begin{tabular}{|>{\columncolor{lightgray}}l|l|>{\columncolor{lightgray}}l|p{0.1\linewidth}|}
			\hline
			\rowcolor{lightgray}\multicolumn{4}{|c|}{\textbf{KARTA WYMAGANIA}}               \\
			\hline
			\hline
			Identyfikator:       & #1                                      & Priorytet: & #2 \\
			\hline
			Nazwa:               & \multicolumn{3}{|p{0.6\linewidth}|}{#3}                   \\
			\hline
			Opis:                & \multicolumn{3}{|p{0.6\linewidth}|}{#4}                   \\
			\hline
			Udziałowiec:         & \multicolumn{3}{|p{0.6\linewidth}|}{#5}                   \\
			\hline
			Wymagania powiązane: & \multicolumn{3}{|p{0.6\linewidth}|}{#6}                   \\
			\hline
		\end{tabular}
		\caption{#3}
		\label{#7}
	\end{table}
}


\newcommand{\placetextbox}[4]{% \placetextbox{<offset top>}{<offset left/right>}{<align>}{<stuff>}
	\setbox0=\hbox{#4}% Put <stuff> in a box
	\AddToShipoutPictureFG*{% Add <stuff> to current page foreground
		\if#3r
			\put(\LenToUnit{\paperwidth-#1},\LenToUnit{\paperheight-#2}){\vtop{{\null}\makebox[0pt][r]{\begin{tabular}{r}#4\end{tabular}}}}%
		\else
			\put(\LenToUnit{#1},\LenToUnit{\paperheight-#2}){\vtop{{\null}\makebox[0pt][l]{\begin{tabular}{l}#4\end{tabular}}}}%
		\fi
	}%
}%


\renewcommand{\maketitle}{%
    \renewcommand{\baselinestretch}{1.0}
	\begin{titlepage}
		\setcounter{page}{1}
		\ifcase\value{@authorcount}
			\setlength{\@authorsep}{4em}%  0 (fallback)
			\setlength{\@bottomsep}{2em}
			\setlength{\@midsep}{3em}
		\or
			\setlength{\@authorsep}{5em}%  1 autor
			\setlength{\@bottomsep}{2em}
			\setlength{\@midsep}{3em}
		\or
			\setlength{\@authorsep}{3em}%  2 autorów
			\setlength{\@bottomsep}{1.5em}
			\setlength{\@midsep}{2em}
		\or
			\setlength{\@authorsep}{1.8em}% 3 autorów
			\setlength{\@bottomsep}{0.8em}
			\setlength{\@midsep}{1.2em}
		\or
			\setlength{\@authorsep}{1em}%  4 autorów
			\setlength{\@bottomsep}{0.4em}
			\setlength{\@midsep}{0.8em}
		\else
			\setlength{\@authorsep}{0.5em}% 5 autorów
			\setlength{\@bottomsep}{0.2em}
			\setlength{\@midsep}{0.5em}
		\fi
		\begin{center}
			\includegraphics[width=1.0\textwidth]{sprz/pjatk} \\
			~ \\
			\textbf{Wydział Informatyki} \\
			\textbf{Filia w Gdańsku} \\[2em]
			\@authorstp
		\end{center}
		\vspace{\@midsep}
		\begin{center}
			{\huge\textbf{\@title}}
		\end{center}
		\vfill
		\begin{flushright}
			Rodzaj pracy \\
			inżynierska \\[0.5em]
			Imię i nazwisko promotora \\
			\@supervisor
		\end{flushright}
		\vspace{1em}
		\begin{center}
			Gdańsk, \@date
		\end{center}
		\newpage		\thispagestyle{empty}\mbox{}% pusta strona po tytulowej
		\newpage		\thispagestyle{empty}
		\textbf{\\Streszczenie:}
		\@nabstract
		\textbf{\\Słowa kluczowe:}
		\@nkeywords
		\newpage
		\thispagestyle{empty}\mbox{}% pusta strona po streszczeniu
	\end{titlepage}
	\setcounter{page}{6}% 1=tyt, 2=pusta, 3=streszcz, 4=pusta, 5=karta, 6=pusta(po karcie)
	\renewcommand{\baselinestretch}{1.0}
}
\newcommand{\@mysmartparbox}[2]{%
	\parbox{#1}{\vspace{0.1cm}#2\vspace{0.1cm}}%
}
\newcommand{\makeprojectcard}{%
	\thispagestyle{empty}
	\begin{center}
		\includegraphics[width=0.8\textwidth]{sprz/pjatk} \\
		{
		\large
		\textbf{Karta projektu}
		}
	\end{center}
	{
	\small
	\begin{center}
		\begin{tabular}{|c|c||c|}
			\hline
			\multicolumn{2}{|p{0.7\linewidth}|}{\textbf{Temat projektu:}

			\@title

			\textbf{Temat projektu po angielsku:}

			\@engtitle
			} & \@mysmartparbox{0.3\linewidth}{\textbf{Akronim:}

				\@acronym

				\textbf{Data ustalenia tematu}

				\@titledate
			}                                                                                                     \\
			\hline
			\multicolumn{2}{|p{0.7\linewidth}|}{\textbf{Promotor:}}      & \@mysmartparbox{0.3\linewidth}{\textbf{Konsultanci:}} \\
			\multicolumn{2}{|p{0.7\linewidth}|}{\@supervisor}      & \@mysmartparbox{0.3\linewidth}{\begin{enumerate}
					\@consultants
				\end{enumerate}}                                                                           \\
			\hline

			\multicolumn{3}{|p{1\linewidth}|}{\textbf{Cele projektu:}

			\@projectgoals}                                                                                       \\ \hline

			\multicolumn{3}{|p{1\linewidth}|}{\textbf{Rezultaty projektu:}

			\@productsandservices

			\@mainfunctionalities}                                                                                       \\ \hline

			\multicolumn{3}{|p{1\linewidth}|}{\textbf{Miary sukcesu:}

			\@successmeasure}                                                                                     \\ \hline
			\multicolumn{3}{|p{1\linewidth}|}{\textbf{Ograniczenia:}

			\@projlimitations}                                                                                    \\ \hline
		\end{tabular}
	\end{center}

	\begin{center}
		\begin{tabular}{|p{0.3\linewidth}|p{0.17\linewidth}|p{0.27\linewidth}|p{0.2\linewidth}|}
			\hline
			\textbf{Wykonawcy} & \textbf{Numer albumu} & \textbf{Specjalizacja} & \textbf{Tryb studiów} \\
			\hline
			\@authorstablerows
		\end{tabular}
	\end{center}

	\begin{center}
		\begin{tabular}{|p{0.4\linewidth}|p{0.6\linewidth}|}
			\hline
			\textbf{Data ukończenia projektu:} 
			
			\@finishdate & \textbf{Recenzent:} 
			
			\@reviewer \\
			\hline
		\end{tabular}
	\end{center}

	}
	\newpage
	\thispagestyle{empty}\mbox{}% pusta strona po karcie projektu
	\newpage
	\pagestyle{plain}
}

\newcommand{\makedeclaration}{%
	\begin{center}
		\textbf{DEPRECATED}
		Według nowych wytycznych nie umieszczamy w pracy deklaracji. Proszę usunąć komendę \\makedeclaration
	\end{center}
	\newpage
}


\newcommand{\makethesisattachments}{%
\chapter*{Załączniki}

Płyta CD z następującą zawartością:
\begin{itemize}
    \item {\em{pliki projektowe}} -- pliki składające się na całość projektu
	\begin{itemize}
		\item repozytorium kodu źródłowego wraz z instrukcją zbudowania i uruchomienia projektu
		\item źródło pracy inżynierskiej.
	\end{itemize}
    \item {\em{\@authorattachment%
praca pisemna}} -- katalog zawierający plik PDF z pracą inżynierską.
\end{itemize}

\newpage
}




\lstset{
belowcaptionskip=1\baselineskip,
breaklines=true,
xleftmargin=\parindent,
showstringspaces=true,         % podkreślanie spacji wewnątrz łańcuchów
numbers=left,                   % gdzie umieszczać numery linii
numberstyle=\footnotesize,      % wielkość czcionki dla numerów linii
captionpos=b,
showstringspaces=false,
basicstyle=\footnotesize\ttfamily,
keywordstyle=\bfseries\color{green!40!black},
commentstyle=\itshape\color{purple!40!black},
identifierstyle=\color{blue},
stringstyle=\color{orange},
literate=
	{á}{{\'a}}1 {é}{{\'e}}1 {í}{{\'i}}1 {ó}{{\'o}}1 {ú}{{\'u}}1
{Á}{{\'A}}1 {É}{{\'E}}1 {Í}{{\'I}}1 {Ó}{{\'O}}1 {Ú}{{\'U}}1
{à}{{\`a}}1 {è}{{\`e}}1 {ì}{{\`i}}1 {ò}{{\`o}}1 {ù}{{\`u}}1
{À}{{\`A}}1 {È}{{\`E}}1 {Ì}{{\`I}}1 {Ò}{{\`O}}1 {Ù}{{\`U}}1
{ä}{{\"a}}1 {ë}{{\"e}}1 {ï}{{\"i}}1 {ö}{{\"o}}1 {ü}{{\"u}}1
{Ä}{{\"A}}1 {Ë}{{\"E}}1 {Ï}{{\"I}}1 {Ö}{{\"O}}1 {Ü}{{\"U}}1
{â}{{\^a}}1 {ê}{{\^e}}1 {î}{{\^i}}1 {ô}{{\^o}}1 {û}{{\^u}}1
{Â}{{\^A}}1 {Ê}{{\^E}}1 {Î}{{\^I}}1 {Ô}{{\^O}}1 {Û}{{\^U}}1
{ã}{{\~a}}1 {ẽ}{{\~e}}1 {ĩ}{{\~i}}1 {õ}{{\~o}}1 {ũ}{{\~u}}1
{Ã}{{\~A}}1 {Ẽ}{{\~E}}1 {Ĩ}{{\~I}}1 {Õ}{{\~O}}1 {Ũ}{{\~U}}1
{œ}{{\oe}}1 {Œ}{{\OE}}1 {æ}{{\ae}}1 {Æ}{{\AE}}1 {ß}{{\ss}}1
{ű}{{\H{u}}}1 {Ű}{{\H{U}}}1 {ő}{{\H{o}}}1 {Ő}{{\H{O}}}1
{ç}{{\c c}}1 {Ç}{{\c C}}1 {ø}{{\o}}1 {Ø}{{\O}}1 {å}{{\r a}}1 {Å}{{\r A}}1
{€}{{\euro}}1 {£}{{\pounds}}1 {«}{{\guillemotleft}}1
{»}{{\guillemotright}}1 {ñ}{{\~n}}1 {Ñ}{{\~N}}1 {¿}{{?`}}1 {¡}{{!`}}1
}
