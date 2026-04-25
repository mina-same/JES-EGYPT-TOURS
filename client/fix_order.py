import re

with open('src/components/sections/TourListingDetailsOne/useTourData.ts', 'r') as f:
    content = f.read()

# Extract mapTourToItem
map_tour_regex = r"  // Map a tour object \(raw or localized\) to FeatureTwo item\n  const mapTourToItem = \(t: any\) => \{[\s\S]*?  \};\n"
match = re.search(map_tour_regex, content)
if match:
    map_tour_code = match.group(0)
    # Remove it from current location
    content = content.replace(map_tour_code, "")
    
    # Insert it before mapRawTourData
    insert_point = content.find("  const mapRawTourData = (tour: any")
    if insert_point != -1:
        content = content[:insert_point] + map_tour_code + "\n" + content[insert_point:]

with open('src/components/sections/TourListingDetailsOne/useTourData.ts', 'w') as f:
    f.write(content)

