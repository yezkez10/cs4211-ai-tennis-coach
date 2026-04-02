COPY public.shot
FROM '/docker-entrypoint-initdb.d/tennis.csv'
WITH (FORMAT CSV, HEADER FALSE, NULL '');
