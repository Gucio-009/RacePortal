package pl.raceportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RacePortalApplication {

  public static void main(String[] args) {
    SpringApplication.run(RacePortalApplication.class, args);
  }
}
