# GCP — nieaktualne

Wcześniejszy wariant (API na GCE e2-micro, front na Cloudflare Pages, `docker-compose.gcp.yml` / `deploy/gcp/`) **nie jest** tym, co stoi na `raceportal.pl`.

Pliki GCP zostały usunięte lub przemianowane (`deploy/vm/`, `docker-compose.vm.yml`, `scripts/api-smoke.sh`). Na żywej maszynie Oracle używamy zwykłego [`docker-compose.yml`](../docker-compose.yml).

Aktualna instrukcja: [`oracle-deploy.md`](./oracle-deploy.md).  
Codzienne włączanie maszyny: [`know-how-uruchamianie.md`](./know-how-uruchamianie.md).  
**Dlaczego odeszliśmy od GCP:** [`decyzje-wdrozeniowe.md`](./decyzje-wdrozeniowe.md) §1.
