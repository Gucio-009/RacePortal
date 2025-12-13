package RACEPORTAL.RACEPORTAL;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "test")
public class test {
    @Id
    @Column(name = "ID")
    private int id;

    @Column(name = "Name")
    private int mark;
}
