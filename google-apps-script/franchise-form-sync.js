/**
 * Google Apps Script to sync Google Forms responses to Supabase
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Update the SUPABASE_URL and SUPABASE_ANON_KEY with your values
 * 5. Set up a trigger to run this function when form responses are submitted
 */

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://kugoonmszogwjxwulhtj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29vbm1zem9nd2p4d3VsaHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODAwMzksImV4cCI6MjA3MTg1NjAzOX0.an8x2hzTQ1PKkKZpBXSDT8nEjBWsgR9_5K9BV_n5z_o';

/**
 * Main function to sync form responses to Supabase
 * This function will be triggered when a new form response is submitted
 */
function syncFormResponseToSupabase(e) {
  try {
    // Get the form response data
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract data from form responses
    const formData = extractFormData(itemResponses);
    
    // Send data to Supabase
    const result = sendToSupabase(formData);
    
    // Log the result
    console.log('Sync result:', result);
    
    // Optional: Send email notification
    sendNotificationEmail(formData, result);
    
  } catch (error) {
    console.error('Error syncing form response:', error);
    // Send error notification
    sendErrorNotification(error);
  }
}

/**
 * Extract data from Google Form responses
 * Update this function to match your form fields
 */
function extractFormData(itemResponses) {
  const formData = {
    google_form_id: FormApp.getActiveForm().getId(),
    google_sheet_row_id: new Date().getTime().toString(),
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    investment_amount: null,
    investment_amount_text: '',
    preferred_territory: '',
    business_experience: '',
    current_business: '',
    why_franchise: '',
    expected_timeline: '',
    additional_notes: '',
    source: 'google_form',
    created_at: new Date().toISOString()
  };
  
  // Try to get responder's email from the form response as fallback
  // This will be available if the form is set to collect respondent emails
  let responderEmail = '';
  try {
    // Get the form response object to access responder's email
    const formResponse = FormApp.getActiveForm().getResponses().pop();
    if (formResponse) {
      responderEmail = formResponse.getRespondentEmail();
    }
  } catch (error) {
    console.log('Could not get responder email:', error);
  }
  
  // Use responder's email as fallback if no email field is found in form
  // The email will be set from the form field mapping below, or use responder's email as fallback
  if (!formData.email) {
    formData.email = responderEmail || 'no-email@placeholder.com';
  }
  
  // Map form responses to database fields
  // Updated to match your specific form fields
  console.log('=== PROCESSING FORM RESPONSES ===');
  itemResponses.forEach(response => {
    const question = response.getItem().getTitle();
    const answer = response.getResponse();
    
    console.log(`Processing: "${question}" = "${answer}"`);
    
                    // Map questions to database fields based on your exact form
      // Use exact string matching instead of case-insensitive
      if (question === 'Full Name') {
        formData.owner_name = answer;
      } else if (question === 'Email Address') {
        formData.email = answer;
      } else if (question === 'Phone Number') {
        formData.phone = answer;
     } else if (question === 'City & State ') {
       // Split city and state if they're combined
       const cityState = answer.split(',').map(s => s.trim());
       formData.city = cityState[0] || '';
       formData.state = cityState[1] || '';
     } else if (question === 'Current Occupation') {
       formData.current_business = answer;
     } else if (question === '  Industry Experience   ') {
       formData.business_experience = answer;
     } else if (question === '  Years of Business Experience  ') {
       formData.business_experience = answer;
           } else if (question === '  Investment Budget Range  ') {
        // Store the original text value instead of converting to numeric
        formData.investment_amount_text = answer;
        
        // Also keep the numeric conversion for backward compatibility
        const budgetText = answer.toString().toLowerCase();
        let budgetAmount = null;
        
        if (budgetText.includes('1-2 lakhs') || budgetText.includes('1-2 lacs')) {
          budgetAmount = 150000; // Average of 1-2 lakhs
        } else if (budgetText.includes('2-5 lakhs') || budgetText.includes('2-5 lacs')) {
          budgetAmount = 350000; // Average of 2-5 lakhs
        } else if (budgetText.includes('5-10 lakhs') || budgetText.includes('5-10 lacs')) {
          budgetAmount = 750000; // Average of 5-10 lakhs
        } else if (budgetText.includes('10-20 lakhs') || budgetText.includes('10-20 lacs')) {
          budgetAmount = 1500000; // Average of 10-20 lakhs
        } else if (budgetText.includes('20+ lakhs') || budgetText.includes('20+ lacs')) {
          budgetAmount = 2500000; // 20+ lakhs
        } else if (budgetText.includes('60 lakhs+')) {
          budgetAmount = 6000000; // 60+ lakhs
        } else {
          // Try to extract any number from the text
          const numbers = budgetText.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            budgetAmount = parseInt(numbers[0]) * 100000; // Convert to rupees
          }
        }
        
        formData.investment_amount = budgetAmount;
     } else if (question === '  Preferred Franchise Type  ') {
       formData.preferred_territory = answer;
     } else if (question === '  Preferred Franchise Model  ') {
       formData.preferred_territory = answer;
     } else if (question === '  City/Region Interested In  ') {
       formData.preferred_territory = answer;
     } else if (question === '  How soon are you looking to start?  ') {
       formData.expected_timeline = answer;
     } else if (question === 'Why do you want to take our franchise?  ') {
       formData.why_franchise = answer;
     } else if (question === 'Any additional comments or questions?') {
       formData.additional_notes = answer;
     } else if (question === 'How did you hear about our franchise opportunity?') {
       // Store in additional notes if there's space
       if (!formData.additional_notes) {
         formData.additional_notes = `Source: ${answer}`;
       } else {
         formData.additional_notes += ` | Source: ${answer}`;
       }
     } else if (question === '  Source of Investment  ') {
       // Store in additional notes
       if (!formData.additional_notes) {
         formData.additional_notes = `Investment Source: ${answer}`;
       } else {
         formData.additional_notes += ` | Investment Source: ${answer}`;
       }
     } else if (question === '  Do you already own/rent commercial space?  ') {
       // Store in additional notes
       if (!formData.additional_notes) {
         formData.additional_notes = `Commercial Space: ${answer}`;
       } else {
         formData.additional_notes += ` | Commercial Space: ${answer}`;
       }
     } else if (question === '  If yes, size of available space  ') {
       // Store in additional notes
       if (!formData.additional_notes) {
         formData.additional_notes = `Space Size: ${answer}`;
       } else {
         formData.additional_notes += ` | Space Size: ${answer}`;
       }
     } else if (question === '  How involved will you be in running the franchise?   ') {
       // Store in additional notes
       if (!formData.additional_notes) {
         formData.additional_notes = `Involvement Level: ${answer}`;
       } else {
         formData.additional_notes += ` | Involvement Level: ${answer}`;
       }
     } else if (question === 'Best time to contact you (IST)') {
       // Store in additional notes
       if (!formData.additional_notes) {
         formData.additional_notes = `Best Contact Time: ${answer}`;
       } else {
         formData.additional_notes += ` | Best Contact Time: ${answer}`;
       }
     }
   });
  
  return formData;
}

/**
 * Send data to Supabase
 */
function sendToSupabase(formData) {
  const url = `${SUPABASE_URL}/rest/v1/franchise_requests`;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    payload: JSON.stringify(formData)
  };
  
  try {
    console.log('Sending data to Supabase:', JSON.stringify(formData, null, 2));
    const response = UrlFetchApp.fetch(url, options);
    console.log('Response code:', response.getResponseCode());
    console.log('Response text:', response.getContentText());
    
    // Check if response is empty
    const responseText = response.getContentText();
    if (!responseText || responseText.trim() === '') {
      console.log('Empty response from Supabase - this might be normal for successful inserts');
      if (response.getResponseCode() === 201) {
        return { success: true, data: { message: 'Record created successfully' } };
      }
    }
    
    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', responseText);
      // If we can't parse JSON but got a 201 status, consider it successful
      if (response.getResponseCode() === 201) {
        return { success: true, data: { message: 'Record created successfully' } };
      }
      return { success: false, error: 'Invalid JSON response from Supabase' };
    }
    
    if (response.getResponseCode() === 201) {
      console.log('Successfully synced to Supabase:', result);
      return { success: true, data: result };
    } else {
      console.error('Supabase error:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('Network error:', error);
    console.error('Error details:', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Send notification email on successful sync
 */
function sendNotificationEmail(formData, result) {
  if (!result.success) return;
  
  const subject = 'New Franchise Request Received';
  const body = `
    A new franchise request has been submitted and synced to the CRM:
    
    Business Name: ${formData.business_name}
    Owner Name: ${formData.owner_name}
    Email: ${formData.email}
    Phone: ${formData.phone}
    City: ${formData.city}
    State: ${formData.state}
    Investment Amount: ${formData.investment_amount ? '₹' + formData.investment_amount.toLocaleString() : 'Not specified'}
    
    The request has been automatically added to your CRM system.
    You can view and manage it at: [Your CRM URL]/crm/franchise-requests
  `;
  
  // Send to admin email (update with your email)
  const adminEmail = 'hello@cutiepaw.in';
  GmailApp.sendEmail(adminEmail, subject, body);
}

/**
 * Send error notification
 */
function sendErrorNotification(error) {
  const subject = 'Franchise Form Sync Error';
  const body = `
    An error occurred while syncing a franchise form response:
    
    Error: ${error.toString()}
    Time: ${new Date().toISOString()}
    
    Please check the Google Apps Script logs for more details.
  `;
  
  // Send to admin email (update with your email)
  const adminEmail = 'hello@cutiepaw.in';
  GmailApp.sendEmail(adminEmail, subject, body);
}

/**
 * Manual sync function - can be run manually to sync existing responses
 */
function manualSync() {
  const form = FormApp.getActiveForm();
  const responses = form.getResponses();
  
  console.log(`Found ${responses.length} responses to sync`);
  
  let successCount = 0;
  let errorCount = 0;
  
  responses.forEach((response, index) => {
    console.log(`Syncing response ${index + 1}/${responses.length}`);
    
    // Create a mock event object
    const mockEvent = {
      response: response
    };
    
    try {
      const result = syncFormResponseToSupabase(mockEvent);
      if (result && result.success) {
        successCount++;
        console.log(`✅ Response ${index + 1} synced successfully`);
      } else {
        errorCount++;
        console.log(`❌ Response ${index + 1} failed:`, result ? result.error : 'Unknown error');
      }
      // Add a small delay to avoid rate limiting
      Utilities.sleep(1000);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error syncing response ${index + 1}:`, error);
    }
  });
  
  console.log(`Manual sync completed: ${successCount} successful, ${errorCount} failed`);
}

/**
 * Test function to verify Supabase connection
 */
function testSupabaseConnection() {
  const url = `${SUPABASE_URL}/rest/v1/franchise_requests?select=count`;
  
  const options = {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log('Supabase connection test successful');
    console.log('Response:', response.getContentText());
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}

/**
 * Debug function to see all form questions and responses
 */
function debugFormFields() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();
  
  console.log('=== FORM QUESTIONS ===');
  items.forEach((item, index) => {
    console.log(`${index + 1}. "${item.getTitle()}"`);
  });
  
  // Get the latest response
  const responses = form.getResponses();
  if (responses.length > 0) {
    const latestResponse = responses[responses.length - 1];
    const itemResponses = latestResponse.getItemResponses();
    
    console.log('\n=== LATEST RESPONSE ===');
    itemResponses.forEach((response, index) => {
      console.log(`${index + 1}. "${response.getItem().getTitle()}" = "${response.getResponse()}"`);
    });
  }
}

/**
 * Setup function - run this once to configure the trigger
 */
function setupTrigger() {
  const form = FormApp.getActiveForm();
  
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncFormResponseToSupabase') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger
  ScriptApp.newTrigger('syncFormResponseToSupabase')
    .forForm(form)
    .onFormSubmit()
    .create();
    
  console.log('Trigger created successfully');
}
