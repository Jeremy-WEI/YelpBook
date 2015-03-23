import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class SQLInsertion {

	static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";
	static final String DB_URL = "jdbc:mysql://mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com/YelpBook";
	static final String USERNAME = "linjie";
	static final String PASSWORD = "464646elsa";
	static final String BUSINESS_PATH = "/Users/YunchenWei/Downloads/yelp_dataset/yelp_academic_dataset_business.json";

	public static void main(String... args) throws SQLException,
			ClassNotFoundException, IOException, ParseException {
		Connection conn = null;
		Statement stmt = null;
		Class.forName(JDBC_DRIVER);
		// System.out.println("Connecting to database...");
		conn = DriverManager.getConnection(DB_URL, USERNAME, PASSWORD);
		// System.out.println("Creating statement...");
		stmt = conn.createStatement();
		JSONParser parser = new JSONParser();
		BufferedReader br = new BufferedReader(new FileReader(BUSINESS_PATH));
		String line;
		StringBuilder sql = new StringBuilder();
		int i = 0;
		while ((line = br.readLine()) != null) {
			if (++i < 27000)
				continue;
			try {
				JSONObject jsonObject = (JSONObject) parser.parse(line);
				sql = new StringBuilder();
				sql.append("INSERT INTO BUSINESS VALUES (");

				String business_id = (String) jsonObject.get("business_id");
				if (business_id == null || business_id.length() > 22)
					continue;
				sql.append("'" + business_id + "',");

				String name = (String) jsonObject.get("name");
				if (name == null || name.length() > 100)
					continue;
				sql.append("'" + name.trim().replace("'", "\\'") + "',");

				Double avgStar = (Double) jsonObject.get("stars");
				if (avgStar == null)
					sql.append("NULL" + ",");
				else {
					sql.append("" + avgStar + ",");
				}

				Double longitude = (Double) jsonObject.get("longitude");
				if (longitude == null)
					sql.append("NULL" + ",");
				else {
					sql.append("" + longitude + ",");
				}

				Double latitude = (Double) jsonObject.get("latitude");
				if (latitude == null)
					sql.append("NULL" + ",");
				else {
					sql.append("" + latitude + ",");
				}

				String address = (String) jsonObject.get("full_address");
				if (address == null || address.trim().length() == 0)
					sql.append("NULL" + ",");
				else {
					sql.append("'" + address.trim().replace("'", "\\'") + "',");
				}

				String city = (String) jsonObject.get("city");
				if (city == null || city.trim().length() == 0)
					sql.append("NULL" + ",");
				else {
					sql.append("'" + city.trim().replace("'", "\\'") + "',");
				}

				String state = (String) jsonObject.get("state");
				if (state == null || state.trim().length() == 0)
					sql.append("NULL" + ",");
				else {
					sql.append("'" + state.trim().replace("'", "\\'") + "',");
				}

				Long reCount = (Long) jsonObject.get("review_count");
				if (reCount == null)
					sql.append("NULL" + ",");
				else {
					sql.append("" + reCount);
				}

				sql.append(")");
				// System.out.println(sql.toString());
				stmt.executeUpdate(sql.toString());
			} catch (Exception e) {
				System.err.println(sql.toString());
			}
			// break;
		}
		br.close();
		stmt.close();
		conn.close();
	}
}
